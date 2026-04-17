import json
import re
from groq import Groq
from core.config import settings


class GroqService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.primary_model = settings.GROQ_MODEL_PRIMARY
        self.secondary_model = settings.GROQ_MODEL_SECONDARY

    def chat_completion(self, messages: list, model: str = None, temperature: float = 0.3) -> str:
        model = model or self.primary_model
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=2048,
            )
            return response.choices[0].message.content
        except Exception as e:
            raise RuntimeError(f"Groq API error: {str(e)}")

    def extract_json(self, text: str) -> dict:
        """Extract JSON from LLM response, handling markdown code blocks."""
        # Remove markdown code blocks
        text = re.sub(r"```(?:json)?\s*", "", text)
        text = re.sub(r"```", "", text)
        text = text.strip()
        # Find JSON object
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        # Try array
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        return {}

    def extract_interaction_data(self, raw_conversation: str) -> dict:
        """Extract structured data from raw conversation using primary model."""
        prompt = f"""Extract structured information from this pharmaceutical sales rep conversation.
Return ONLY valid JSON with these exact fields:
{{
  "key_messages_delivered": "string - key messages the rep delivered to the HCP",
  "hcp_feedback": "string - HCP's feedback and objections",
  "products_mentioned": ["list", "of", "product", "names"],
  "medical_terms": ["list", "of", "medical", "terms"],
  "follow_up_commitments": "string - any follow-up commitments made",
  "ai_summary": "string - 3 sentence professional summary of the interaction",
  "entities": {{"products": [], "conditions": [], "action_items": []}}
}}

Conversation: {raw_conversation}

Respond with ONLY the JSON object, no other text."""

        messages = [{"role": "user", "content": prompt}]
        response = self.chat_completion(messages, model=self.primary_model)
        return self.extract_json(response)

    def compute_interaction_diff(self, current_record: dict, modification_request: str) -> dict:
        """Compute field diff using secondary model."""
        prompt = f"""You are a CRM data assistant. Given this existing interaction record and a modification request,
return ONLY a JSON object with the fields that need to be updated.
Preserve all existing data not mentioned in the request.
Return ONLY valid JSON.

Existing record: {json.dumps(current_record, indent=2, default=str)}

Modification request: {modification_request}

Return ONLY the changed fields as JSON (e.g. {{"follow_up_date": "2024-03-20", "products_discussed": ["Jardiance", "Ozempic"]}})"""

        messages = [{"role": "user", "content": prompt}]
        response = self.chat_completion(messages, model=self.secondary_model)
        return self.extract_json(response)

    def suggest_next_action(self, profile: dict, history: list) -> dict:
        """Generate next best action recommendation."""
        prompt = f"""You are a pharma sales strategist. Based on this HCP profile and interaction history,
recommend the single most impactful next action for this field rep to take within 30 days.

HCP Profile: {json.dumps(profile, default=str)}
Recent Interactions (last 5): {json.dumps(history[:5], default=str)}

Respond with ONLY valid JSON:
{{
  "action_type": "string (e.g. follow_up_visit, send_literature, schedule_meeting, virtual_detail)",
  "description": "string - specific description of the action",
  "priority": "high|medium|low",
  "due_date": "YYYY-MM-DD (within 30 days)",
  "rationale": "string - why this action is recommended"
}}"""

        messages = [{"role": "user", "content": prompt}]
        response = self.chat_completion(messages, model=self.secondary_model)
        return self.extract_json(response)

    def check_compliance(self, interaction_data: dict) -> dict:
        """Check compliance using primary model."""
        prompt = f"""You are a pharmaceutical compliance officer. Review this interaction record for compliance risks.
Check for:
1. Off-label promotion (unapproved indications)
2. Excessive sample quantities (>6 per product per visit)
3. Improper inducement language
4. Missing required disclosures

Interaction: {json.dumps(interaction_data, default=str)}

Respond with ONLY valid JSON:
{{
  "status": "compliant|flagged|pending",
  "flags": ["list of specific issues found, empty if none"],
  "recommendations": ["list of recommendations, empty if compliant"],
  "notes": "string - brief summary of compliance review"
}}"""

        messages = [{"role": "user", "content": prompt}]
        response = self.chat_completion(messages, model=self.primary_model)
        result = self.extract_json(response)
        if not result:
            result = {"status": "pending", "flags": [], "recommendations": [], "notes": "Review pending"}
        return result

    def general_chat(self, messages: list, hcp_context: dict = None) -> str:
        """General conversational response."""
        system_content = """You are an AI assistant for pharmaceutical field representatives.
You help log HCP interactions, provide insights, and support sales activities.
Be professional, concise, and focused on actionable insights.

Available actions you can help with:
- Log a new interaction (say "logging interaction" when you do this)
- Edit an existing interaction (say "editing interaction" when you do this)
- Get HCP profile information
- Suggest next best actions
- Check compliance

When the user describes a visit or interaction, extract the key details and confirm before logging."""

        if hcp_context:
            system_content += f"\n\nCurrent HCP Context: {json.dumps(hcp_context, default=str)}"

        full_messages = [{"role": "system", "content": system_content}] + messages
        return self.chat_completion(full_messages, model=self.secondary_model, temperature=0.7)


groq_service = GroqService()
