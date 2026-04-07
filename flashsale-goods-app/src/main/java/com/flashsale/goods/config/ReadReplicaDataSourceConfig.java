package com.flashsale.goods.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;

@Configuration
public class ReadReplicaDataSourceConfig {

    @Bean(name = "readDataSource")
    public DataSource readDataSource(
            @Value("${flashsale.datasource.read.url}") String url,
            @Value("${flashsale.datasource.read.username}") String username,
            @Value("${flashsale.datasource.read.password}") String password,
            @Value("${flashsale.datasource.read.driver-class-name:org.postgresql.Driver}") String driverClassName
    ) {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setUrl(url);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName(driverClassName);
        return dataSource;
    }

    @Bean(name = "readJdbcTemplate")
    public JdbcTemplate readJdbcTemplate(@Qualifier("readDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}

