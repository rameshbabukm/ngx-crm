package com.ngxcrm.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;

import java.util.Arrays;

@SpringBootApplication
public class ApiGatewayApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiGatewayApplication.class, args);
	}

	@Bean
	public CorsWebFilter corsWebFilter() {
		CorsConfiguration corsConfig = new CorsConfiguration();
		corsConfig.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
		corsConfig.setMaxAge(3600L);
		corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		corsConfig.setAllowedHeaders(Arrays.asList("Content-Type", "Authorization", "X-Requested-With"));
		corsConfig.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", corsConfig);

		return new CorsWebFilter(source);
	}

	@Bean
	public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
		return builder.routes()
			.route("c360-service", r -> r.path("/c360/**")
				.filters(f -> f.rewritePath("/c360/(?<segment>.*)", "/${segment}"))
				.uri("http://c360-service:8087"))
			.route("c360-graphql", r -> r.path("/graphql/c360")
				.filters(f -> f.rewritePath("/graphql/c360", "/graphql"))
				.uri("http://c360-service:8087"))
			.route("c360-graphql-slash", r -> r.path("/graphql/c360/")
				.filters(f -> f.rewritePath("/graphql/c360/", "/graphql"))
				.uri("http://c360-service:8087"))
			.route("sales-service", r -> r.path("/sales/**")
				.filters(f -> f.rewritePath("/sales/(?<segment>.*)", "/${segment}"))
				.uri("http://sales-service:8081"))
			.route("sales-graphql", r -> r.path("/graphql/sales")
				.filters(f -> f.rewritePath("/graphql/sales", "/graphql"))
				.uri("http://sales-service:8081"))
			.route("sales-graphql-slash", r -> r.path("/graphql/sales/")
				.filters(f -> f.rewritePath("/graphql/sales/", "/graphql"))
				.uri("http://sales-service:8081"))
			.route("service-core", r -> r.path("/service/**")
				.filters(f -> f.rewritePath("/service/(?<segment>.*)", "/${segment}"))
				.uri("http://service-core:8084"))
			.route("service-graphql", r -> r.path("/graphql/service")
				.filters(f -> f.rewritePath("/graphql/service", "/graphql"))
				.uri("http://service-core:8084"))
			.route("service-graphql-slash", r -> r.path("/graphql/service/")
				.filters(f -> f.rewritePath("/graphql/service/", "/graphql"))
				.uri("http://service-core:8084"))
			.route("identity-service", r -> r.path("/identity/**")
				.filters(f -> f.rewritePath("/identity/(?<segment>.*)", "/${segment}"))
				.uri("http://identity-service:8085"))
			.route("identity-graphql", r -> r.path("/graphql/identity")
				.filters(f -> f.rewritePath("/graphql/identity", "/graphql"))
				.uri("http://identity-service:8085"))
			.route("identity-graphql-slash", r -> r.path("/graphql/identity/")
				.filters(f -> f.rewritePath("/graphql/identity/", "/graphql"))
				.uri("http://identity-service:8085"))
			.build();
	}
}
