<?php

namespace {
    use Illuminate\Contracts\Auth\Guard;
    use Illuminate\Contracts\Auth\AuthFactory;
    use App\Models\User;

    /**
     * Get the authentication guard or user
     */
    function auth(?string $guard = null): Guard|AuthFactory {
        return \Illuminate\Support\Facades\Auth::guard($guard);
    }
}

namespace Illuminate\Contracts\Auth {
    use App\Models\User;

    interface Guard {
        public function user(): ?User;
    }

    interface AuthFactory {
        public function guard(?string $name = null): Guard;
    }
}
