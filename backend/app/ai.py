import os
from typing import List, Dict, Any
import json
import logging
import requests
import asyncio
from pathlib import Path

# Try importing Google Generative AI
try:
    import google.generativeai as genai
    HAS_GOOGLE_AI = True
except ImportError:
    HAS_GOOGLE_AI = False

logger = logging.getLogger(__name__)

class AICollaborator:
    def __init__(self):
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        
        if self.google_api_key and HAS_GOOGLE_AI:
            logger.info("Using Google Gemini API")
            genai.configure(api_key=self.google_api_key)
            self.model_name = "gemini-pro"
            self.use_google = True
        else:
            logger.info("Using Local Ollama (Fallback)")
            self.api_url = "http://localhost:11434/api/generate"
            self.model_name = "llama3.2" 
            self.use_google = False

    async def _call_gemini(self, prompt: str) -> str:
        try:
            model = genai.GenerativeModel('gemini-pro')
            # Gemini runs synchronously in its basic form, so we wrap it
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: model.generate_content(prompt))
            return response.text
        except Exception as e:
            logger.error(f"Gemini Error: {e}")
            raise e

    async def _call_ollama(self, prompt: str) -> str:
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: requests.post(
            self.api_url,
            json=payload,
            timeout=10
        ))
        if response.status_code == 200:
            data = response.json()
            return data.get("response", "")
        else:
             raise Exception(f"Ollama Status {response.status_code}")

    async def _generate_response(self, prompt: str) -> str:
        if self.use_google:
            try:
                # Add explicit JSON instruction for Gemini if not present in prompt (it usually is)
                return await self._call_gemini(prompt)
            except Exception as e:
                logger.error(f"Gemini failed, trying Ollama fallback: {e}")
                # Fallback to Ollama if Gemini fails
                try:
                     return await self._call_ollama(prompt)
                except:
                     return "{}"
        else:
            try:
                return await self._call_ollama(prompt)
            except Exception as e:
                logger.error(f"Ollama failed: {e}")
                return "{}"

    async def chat(self, message: str, context: Dict[str, Any] = None) -> str:
        # Load external rulebook
        rules = ""
        try:
            rule_path = Path(__file__).parent / "rules.txt"
            if rule_path.exists():
                 with open(rule_path, "r", encoding="utf-8") as f:
                     rules = f.read()
        except:
             pass

        prompt_text = f"""
        {rules}
        
        CURRENT CONTEXT:
        {json.dumps(context, indent=2) if context else "No context loaded."}
        
        USER INPUT: {message}
        
        SYSTEM INSTRUCTIONS:
        1. You are a Factory AI. Control machines via JSON 'actions'.
        2. 'response' must be Natural Language (Traditional Chinese).
        3. **CRITICAL**: Return ONLY VALID JSON.
        
        FORMAT:
        {{
            "response": "Your chat response here",
            "actions": [
                {{"type": "SET_SPEED", "machine_id": "L1-CUT-01", "value": 3000}}
            ]
        }}
        """
        
        try:
            content = await self._generate_response(prompt_text)
            
            # Clean Markdown
            content = content.replace("```json", "").replace("```", "").strip()
            
            ai_resp = json.loads(content)
            reply = ai_resp.get("response", "Processing...")
            
            # Handle Actions
            actions = ai_resp.get("actions", [])
            
            cmd_tags = ""
            for action in actions:
                atype = action.get("type", "").upper()
                mid = action.get("machine_id")
                val = action.get("value", 0)
                
                if atype == "RESET":
                        cmd_tags += f"[[EXECUTE:reset|{mid}]] "
                elif atype == "SET_SPEED":
                        cmd_tags += f"[[EXECUTE:set_speed:{val}|{mid}]] "
                elif atype == "ADJUST_SPEED":
                        cmd_tags += f"[[EXECUTE:adjust_speed:{val}|{mid}]] "
                elif atype == "MAINTENANCE":
                        cmd_tags += f"[[EXECUTE:maintenance|{mid}]] "

            return f"{cmd_tags}{reply}"

        except Exception as e:
            logger.error(f"Chat Error: {e}")
            return "系統忙碌中 (AI Error)"

    async def analyze_anomaly(self, anomaly: Dict[str, Any]) -> str:
        prompt_text = f"""
        Analyze this factory anomaly and suggest actions.
        Anomaly: {json.dumps(anomaly, indent=2)}
        
        Provide a concise response in valid JSON format with the following keys:
        - root_cause: A short explanation of the cause.
        - action_plan: A list of 3 short steps.
        - suggested_action: A single short action command (e.g., "Reset Machine").
        
        Response (JSON only):
        """
        
        try:
            content = await self._generate_response(prompt_text)
            content = content.replace("```json", "").replace("```", "").strip()
            return content
        except Exception as e:
            logger.error(f"Analysis Error: {e}")
            return json.dumps({"root_cause": "Error", "action_plan": [], "suggested_action": "Check Manual"})

    async def evaluate_autonomy(self, context: Dict[str, Any]) -> Dict[str, Any]:
        prompt_text = f"""
        CURRENT CONTEXT:
        {json.dumps(context, indent=2)}
        
        TASK:
        You are an Intelligent Factory Manager. Optimize the factory.
        
        SCENARIOS:
        - High Demand (>5 orders) -> Speed Up.
        - Low Demand (<2 orders) -> Slow Down.
        - Overheat (>95C) -> Slow Down / Stop.
        
        RESPONSE FORMAT (Valid JSON ONLY):
        {{
            "action_needed": true/false,
            "message": "Reasoning...",
            "actions": [
                {{
                    "command": "adjust_speed:500",
                    "machine_id": "L1-CUT-01",
                    "reason": "High Orders"
                }}
            ]
        }}
        """
        
        try:
            content = await self._generate_response(prompt_text)
            content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except Exception as e:
            logger.error(f"Autonomy Error: {e}")
            return {"action_needed": False}
