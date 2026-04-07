package com.flashsale.goods.controller;

import com.flashsale.common.Result;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/goods")
public class ReadWriteRouteProbeController {
    private final JdbcTemplate writeJdbcTemplate;
    private final JdbcTemplate readJdbcTemplate;
    private final DataSource dataSource;

    public ReadWriteRouteProbeController(
            JdbcTemplate jdbcTemplate,
            @Qualifier("readJdbcTemplate") JdbcTemplate readJdbcTemplate,
            DataSource dataSource
    ) {
        this.writeJdbcTemplate = jdbcTemplate;
        this.readJdbcTemplate = readJdbcTemplate;
        this.dataSource = dataSource;
    }

    @GetMapping("/route-test/{id}")
    public Result<Map<String, Object>> routeTest(@PathVariable("id") Long id) {
        Integer touched = writeJdbcTemplate.update("UPDATE product SET updated_at = NOW() WHERE id = ?", id);
        Integer readCount = readJdbcTemplate.queryForObject("SELECT COUNT(1) FROM product WHERE id = ?", Integer.class, id);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("writeTouchedRows", touched == null ? 0 : touched);
        data.put("readMatchedRows", readCount == null ? 0 : readCount);
        data.put("writeDataSource", dataSource.getClass().getSimpleName());
        data.put("readDataSource", "readJdbcTemplate");
        return Result.success(data);
    }
}

