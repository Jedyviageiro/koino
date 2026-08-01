package com.koino.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.koino.backend.model.PlanTemplate;

class PlanLocalizationServiceTest {
    @Test
    void returnsPortuguesePlanCopyAndEnglishFallback() {
        PlanTemplate plan = new PlanTemplate();
        plan.setPlanCode("P06");
        plan.setName("Foundations of Christian Faith");
        plan.setDescription("English description");
        PlanLocalizationService service = new PlanLocalizationService();

        assertEquals("Fundamentos da Fé Cristã", service.name(plan, "pt-BR"));
        assertEquals(
            "Foundations of Christian Faith",
            service.name(plan, "en")
        );
    }
}
