<?php

namespace App\Exceptions;

use Exception;

class ServiceException extends Exception
{
    public function __construct(string $message, private readonly int $statusCode = 400)
    {
        parent::__construct($message);
    }

    public static function badRequest(string $message): self
    {
        return new self($message, 400);
    }

    public static function forbidden(string $message): self
    {
        return new self($message, 403);
    }

    public static function notFound(string $message): self
    {
        return new self($message, 404);
    }

    public static function serverError(string $message): self
    {
        return new self($message, 500);
    }

    public function statusCode(): int
    {
        return $this->statusCode;
    }
}
