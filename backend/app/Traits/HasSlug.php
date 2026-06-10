<?php

namespace App\Traits;

use Illuminate\Support\Str;

trait HasSlug
{
    protected static function bootHasSlug(): void
    {
        static::creating(function ($model) {
            $slugColumn = method_exists($model, 'slugColumn')
                ? $model->slugColumn()
                : 'slug';

            $sourceColumn = method_exists($model, 'slugSourceColumn')
                ? $model->slugSourceColumn()
                : 'name';

            if (!empty($model->{$slugColumn}) || empty($model->{$sourceColumn})) {
                return;
            }

            $model->{$slugColumn} = Str::slug($model->{$sourceColumn}) . '-' . uniqid();
        });
    }
}
