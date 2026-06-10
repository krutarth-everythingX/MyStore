<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class IndianPostalCode implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $postalCode = trim((string) $value);

        if (!preg_match('/^[1-9][0-9]{5}$/', $postalCode)) {
            $fail('The :attribute must be a valid 6-digit Indian postal code.');
        }
    }
}
