<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class FlexiblePostalCode implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $postalCode = trim((string) $value);

        if ($postalCode === '') {
            $fail('The :attribute field is required.');
            return;
        }

        if (! preg_match('/^[A-Za-z0-9][A-Za-z0-9\s-]{1,19}$/', $postalCode)) {
            $fail('The :attribute must be a valid postal code.');
        }
    }
}
