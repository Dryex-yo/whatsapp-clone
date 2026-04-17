<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

/**
 * @mixin \Illuminate\Foundation\Testing\Concerns\InteractsWithAuthentication
 * @mixin \Illuminate\Foundation\Testing\Concerns\MakesHttpRequests
 * @mixin \Illuminate\Foundation\Testing\Concerns\InteractsWithDatabase
 * @mixin \Illuminate\Foundation\Testing\Concerns\InteractsWithSession
 * @mixin \Illuminate\Foundation\Testing\Concerns\InteractsWithExceptionHandling
 */
abstract class TestCase extends BaseTestCase
{
    //
}
