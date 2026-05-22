package com.flashsale.flashsale_pro.config;

import com.flashsale.flashsale_pro.security.AuthInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcAuthConfig implements WebMvcConfigurer {

    private final AuthInterceptor authInterceptor;

    public WebMvcAuthConfig(AuthInterceptor authInterceptor) {
        this.authInterceptor = authInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        "/api/user/login",
                        "/api/user/register",
                        "/api/flash-sale/events",
                        "/api/flash-sale/events/*/items",
                        "/api/flash-sale/items/*",
                        "/actuator/health"
                );
    }
}
