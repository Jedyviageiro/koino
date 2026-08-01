package com.koino.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import org.junit.jupiter.api.Test;

class LicensedSqlBibleImportServiceTest {
    @Test
    void parsesQuotedSqlValuesAndEscapedApostrophes() {
        List<String> values = LicensedSqlBibleImportService.parseValues(
            "INSERT INTO super_bible VALUES('NT',43,'John',11,35,"
                + "'Jesus'' response.','NIV','EN');"
        );

        assertEquals(8, values.size());
        assertEquals("John", values.get(2));
        assertEquals("Jesus' response.", values.get(5));
        assertEquals("NIV", values.get(6));
    }
}
