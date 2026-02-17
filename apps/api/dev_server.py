import errno
import os
import socket
import sys

import uvicorn

DEFAULT_PORT = 8000
MAX_PORT_ATTEMPTS = 25

RETRYABLE_BIND_ERRORS = {
    errno.EACCES,
    errno.EADDRINUSE,
}

if os.name == "nt":
    RETRYABLE_BIND_ERRORS.update({10013, 10048})


def parse_port(raw_port: str | None) -> int:
    if not raw_port:
        return DEFAULT_PORT

    try:
        port = int(raw_port)
    except ValueError as exc:
        raise ValueError(f"Invalid PORT value: {raw_port!r}. PORT must be an integer.") from exc

    if port < 1 or port > 65535:
        raise ValueError(f"Invalid PORT value: {raw_port!r}. PORT must be in range 1-65535.")

    return port


def can_bind(host: str, port: int) -> tuple[bool, OSError | None]:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind((host, port))
        except OSError as exc:
            return False, exc
    return True, None


def select_port(host: str, requested_port: int) -> tuple[int, OSError | None]:
    last_retryable_error: OSError | None = None

    for port in range(requested_port, requested_port + MAX_PORT_ATTEMPTS):
        available, error = can_bind(host, port)
        if available:
            return port, last_retryable_error

        if error and error.errno in RETRYABLE_BIND_ERRORS:
            last_retryable_error = error
            continue

        if error:
            raise RuntimeError(f"Failed to bind to {host}:{port}: {error}") from error

    message = (
        f"Unable to find an available port in range {requested_port}-"
        f"{requested_port + MAX_PORT_ATTEMPTS - 1}."
    )
    if last_retryable_error:
        message = f"{message} Last error: {last_retryable_error}"
    raise RuntimeError(message)


def main() -> int:
    host = os.getenv("HOST", "127.0.0.1")

    try:
        requested_port = parse_port(os.getenv("PORT"))
        selected_port, bind_error = select_port(host, requested_port)
    except ValueError as exc:
        print(exc, file=sys.stderr)
        return 1
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        return 1

    if selected_port != requested_port:
        error_text = str(bind_error) if bind_error else "port check failed"
        print(
            f"Port {requested_port} is unavailable ({error_text}). "
            f"Using port {selected_port} instead."
        )

    uvicorn.run("app.main:app", host=host, port=selected_port, reload=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
