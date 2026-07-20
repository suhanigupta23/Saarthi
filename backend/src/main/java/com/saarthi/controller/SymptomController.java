package com.saarthi.controller;

import com.saarthi.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/symptoscan")
public class SymptomController {

    @Autowired
    private GeminiService geminiService;

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
    public ResponseEntity<?> predictCondition(@RequestBody Map<String, List<String>> request) {
        List<String> userSymptoms = request.getOrDefault("symptoms", Collections.emptyList());
        if (userSymptoms.isEmpty()) {
            return ResponseEntity.ok(Map.of("predicted_condition", "No symptoms selected", "confidence", 0.0, "urgency", "Low"));
        }

        System.out.println(">>> SymptomController: Received predict request for symptoms: " + userSymptoms);
        try {
            // Call the free Gemini AI Studio service
            String rawJson = geminiService.analyzeSymptoms(userSymptoms);
            System.out.println(">>> SymptomController: Gemini service returned: " + rawJson);
            
            // Return JSON string directly so your frontend parses it automatically
            return ResponseEntity.ok()
                    .header("Content-Type", "application/json")
                    .body(rawJson);
        } catch (Exception e) {
            System.err.println(">>> SymptomController Error invoking Gemini: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/tips")
    public ResponseEntity<?> getTips() {
        List<String> shuffledTips = new ArrayList<>(SELF_CARE_TIPS);
        Collections.shuffle(shuffledTips);
        List<String> selectedTips = shuffledTips.subList(0, Math.min(4, shuffledTips.size()));
        return ResponseEntity.ok(Map.of("tips", selectedTips));
    }
}
