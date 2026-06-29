<?php

namespace App\Providers;

use App\Events\OrderPlaced;
use App\Listeners\SendOrderPlacedNotification;
use App\Models\Order;
use App\Models\Product;
use App\Observers\ProductObserver;
use App\Policies\OrderPolicy;
use App\Policies\ProductPolicy;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
        Product::observe(ProductObserver::class);
        Event::listen(OrderPlaced::class, SendOrderPlacedNotification::class);
        ResetPasswordNotification::createUrlUsing(function (object $user, string $token): string {
            $source = request()->input('source') === 'profile' ? 'profile' : 'forgot';

            return url(route('password.reset', [
                'token' => $token,
                'email' => $user->email,
                'source' => $source,
            ], false));
        });

        \Illuminate\Support\Facades\RateLimiter::for('auth', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(5)->by($request->ip());
        });

        \Illuminate\Support\Facades\RateLimiter::for('search', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(30)->by($request->ip());
        });
    }
}
