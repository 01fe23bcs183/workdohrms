<?php

namespace App\Enums;

enum DocumentOwnerType: string
{
    case Employee = 'employee';
    case Company = 'company';
    case Accountant = 'accountant';

    public function label(): string
    {
        return match($this) {
            self::Employee => 'Employee',
            self::Company => 'Company',
            self::Accountant => 'Accountant',
        };
    }
}
