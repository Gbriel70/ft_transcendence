wsl

ports 8080, 8443, 5432 already in use, changed to 8081, 8444, 5433.

CRLF (Windows) line endings in the init-vault.sh script. When Docker tried to execute it with the ENTRYPOINT, it couldn't find the file due to the carriage returns corrupting the shebang line.
