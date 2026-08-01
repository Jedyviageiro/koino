package com.koino.backend.service;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.koino.backend.repository.BattleQuestionRepository;
import com.koino.backend.model.BattleQuestion;
import com.koino.backend.service.BattleQuestionCatalogService.QuestionCatalogEntry;

@Component
public class BattleQuestionBackfillWorker {
    private static final Logger LOGGER =
        LoggerFactory.getLogger(BattleQuestionBackfillWorker.class);

    private final BattleQuestionRepository questionRepository;
    private final GeminiBattleQuestionClient geminiClient;
    private final BattleQuestionCatalogService catalogService;
    private final boolean enabled;
    private final int targetPerTier;

    public BattleQuestionBackfillWorker(
        BattleQuestionRepository questionRepository,
        GeminiBattleQuestionClient geminiClient,
        BattleQuestionCatalogService catalogService,
        @Value("${battle.questions.gemini.enabled:true}") boolean enabled,
        @Value("${battle.questions.target-per-tier:150}") int targetPerTier
    ) {
        this.questionRepository = questionRepository;
        this.geminiClient = geminiClient;
        this.catalogService = catalogService;
        this.enabled = enabled;
        this.targetPerTier = targetPerTier;
    }

    @Scheduled(
        initialDelayString = "${battle.questions.gemini.initial-delay-ms:45000}",
        fixedDelayString = "${battle.questions.gemini.delay-ms:45000}"
    )
    public void generateNextBatch() {
        if (!enabled) {
            return;
        }
        List<BattleQuestion> untranslated = questionRepository
            .findByPromptPtIsNullOrderByQuestionIdAsc(PageRequest.of(0, 12));
        if (!untranslated.isEmpty()) {
            try {
                List<QuestionCatalogEntry> source = untranslated.stream()
                    .map(this::toCatalogEntry)
                    .toList();
                int saved = catalogService.savePortugueseTranslations(
                    geminiClient.translatePortuguese(source)
                );
                LOGGER.info("Backed up {} Portuguese Battle Space translations", saved);
            } catch (Exception exception) {
                LOGGER.warn(
                    "Battle Space translation backfill will retry later: {}",
                    exception.getMessage()
                );
            }
            return;
        }
        int tier = 0;
        long smallestCount = Long.MAX_VALUE;
        for (int currentTier = 1; currentTier <= 6; currentTier++) {
            long count = questionRepository.countByDifficulty(currentTier);
            if (count < targetPerTier && count < smallestCount) {
                tier = currentTier;
                smallestCount = count;
            }
        }
        if (tier == 0) {
            return;
        }
        try {
            int requested = (int) Math.min(20, targetPerTier - smallestCount);
            int saved = catalogService.appendGenerated(
                geminiClient.generate(tier, requested)
            );
            LOGGER.info(
                "Backed up {} Gemini Battle Space questions for tier {}",
                saved,
                tier
            );
        } catch (Exception exception) {
            LOGGER.warn(
                "Battle Space question backfill will retry later: {}",
                exception.getMessage()
            );
        }
    }

    private QuestionCatalogEntry toCatalogEntry(BattleQuestion question) {
        return new QuestionCatalogEntry(
            question.getCatalogKey(),
            question.getPrompt(),
            List.of(
                question.getOptionA(), question.getOptionB(),
                question.getOptionC(), question.getOptionD()
            ),
            question.getCorrectOption(), question.getDifficulty(),
            question.getCategory(), question.getReference(),
            question.getExplanation(), null, null, null, null
        );
    }
}
