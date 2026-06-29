<?php

namespace Database\Seeders;

class SeederSupport
{
    public static function defaultSellerSettings(array $overrides = []): array
    {
        return array_replace([
            'profilePhoto' => '',
            'twoFactorEnabled' => true,
            'secondaryPhone' => '',
            'storeLogo' => '',
            'storeBanner' => '',
            'storeDescription' => 'Verified marketplace seller with complete profile, inventory, shipping, returns, payout, and compliance defaults configured.',
            'businessType' => 'Sole Proprietorship',
            'panNumber' => '',
            'registrationNumber' => '',
            'addressLine1' => '',
            'addressLine2' => '',
            'city' => '',
            'state' => '',
            'pickupCountry' => 'India',
            'pincode' => '',
            'accountHolderName' => '',
            'bankName' => '',
            'accountNumber' => '',
            'ifscCode' => '',
            'upiId' => '',
            'cancelledCheque' => '',
            'gstRegistered' => true,
            'gstCertificate' => '',
            'panCard' => '',
            'businessLicense' => '',
            'addressProof' => '',
            'freeShippingAbove' => '1000',
            'packageWeight' => '0.5',
            'packageLength' => '20',
            'packageWidth' => '15',
            'packageHeight' => '10',
            'weightUnit' => 'Kg',
            'returnWindow' => '15 Days',
            'acceptReturns' => true,
            'orderEmail' => true,
            'orderSms' => true,
            'orderWhatsapp' => true,
            'promotionalEmails' => false,
            'storeStatus' => 'Active',
        ], $overrides);
    }
}
