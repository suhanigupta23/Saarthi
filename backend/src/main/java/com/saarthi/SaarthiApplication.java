package com.saarthi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class SaarthiApplication {
    public static void main(String[] args) {
        SpringApplication.run(SaarthiApplication.class, args);
    }
}
