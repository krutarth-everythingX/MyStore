<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserIdentifierTest extends TestCase
{
    use RefreshDatabase;

    public function test_buyer_accounts_receive_a_customer_id(): void
    {
        $buyer = User::factory()->create();

        $this->assertSame('buyer', $buyer->role);
        $this->assertMatchesRegularExpression('/^B-(?:[1-9][A-Z]){6}$/', $buyer->customer_id);
        $this->assertNull($buyer->seller_id);
    }

    public function test_seller_accounts_receive_a_seller_id(): void
    {
        $seller = User::factory()->create([
            'role' => 'seller',
        ]);

        $this->assertMatchesRegularExpression('/^S-(?:[1-9][A-Z]){6}$/', $seller->seller_id);
        $this->assertNull($seller->customer_id);
    }
}
