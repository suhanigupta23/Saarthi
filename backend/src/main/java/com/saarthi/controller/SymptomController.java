package com.saarthi.controller;

import com.saarthi.dto.SymptomAnalysisRequest;
import com.saarthi.dto.SymptomAnalysisResponse;
import com.saarthi.service.GeminiService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/symptoscan")
public class SymptomController {

    private final GeminiService geminiService;

    public SymptomController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    private static final List<String> SELF_CARE_TIPS = Arrays.asList(
            "💧 Stay well-hydrated throughout the day.",
            "🧘‍♀️ Practice yoga or gentle stretching for pelvic pain.",
            "📝 Track your menstrual cycle to identify patterns.",
            "🥗 Eat a balanced diet rich in fiber and omega-3s.",
            "😴 Get 7-9 hours of quality sleep each night.",
            "🌿 Herbal teas like chamomile or ginger may relieve cramps.",
            "🚶‍♀️ Light exercise can boost your mood and reduce bloating.",
            "📵 Take screen breaks to reduce stress and eye strain.",
            "📚 Learn about your condition to make informed decisions."
    );

    @PostMapping("/predict")
    public ResponseEntity<SymptomAnalysisResponse> predictCondition(
            @Valid @RequestBody SymptomAnalysisRequest request) {
        return ResponseEntity.ok(geminiService.analyzeSymptoms(request.symptoms()));
    }

    @GetMapping("/tips")
    public ResponseEntity<?> getTips() {
        List<String> shuffledTips = new ArrayList<>(SELF_CARE_TIPS);
        Collections.shuffle(shuffledTips);
        List<String> selectedTips = shuffledTips.subList(0, Math.min(4, shuffledTips.size()));
        return ResponseEntity.ok(Map.of("tips", selectedTips));
    }
}
