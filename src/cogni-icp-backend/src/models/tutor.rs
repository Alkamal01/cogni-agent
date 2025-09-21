use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ic_stable_structures::storable::{Storable, Bound};
use std::borrow::Cow;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Tutor {
    pub id: u64,
    pub public_id: String,
    pub user_id: Principal,
    pub name: String,
    pub description: String,
    pub teaching_style: String,
    pub personality: String,
    pub expertise: Vec<String>,
    pub knowledge_base: Vec<String>,
    pub is_pinned: bool,
    pub avatar_url: Option<String>,
    pub voice_id: Option<String>,
    pub voice_settings: HashMap<String, String>,
    pub created_at: u64,
    pub updated_at: u64,
}

impl Storable for Tutor {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(serde_cbor::to_vec(&self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        serde_cbor::from_slice(bytes.as_ref()).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TutorSession {
    pub id: u64,
    pub public_id: String,
    pub user_id: Principal,
    pub tutor_id: u64,
    pub topic: String,
    pub status: String, // "active", "completed", "archived"
    pub created_at: u64,
    pub updated_at: u64,
    pub messages: Vec<TutorMessage>,
}

impl Storable for TutorSession {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(serde_cbor::to_vec(&self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        serde_cbor::from_slice(bytes.as_ref()).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TutorMessage {
    pub id: u64,
    pub sender: String, // "user" or "tutor"
    pub content: String,
    pub timestamp: u64,
    pub has_audio: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TutorCourse {
    pub id: u64,
    pub tutor_id: u64,
    pub session_id: u64,
    pub topic: String,
    pub outline: String, // Storing as a JSON string
    pub difficulty_level: String,
    pub estimated_duration: String,
    pub created_at: u64,
    pub modules: Vec<CourseModule>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CourseModule {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub order: u32,
    pub content: Option<String>, // Storing as a JSON string
    pub status: String, // "pending", "completed"
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TutorRating {
    pub id: u64,
    pub user_id: Principal,
    pub tutor_id: u64,
    pub rating: f32,
    pub comment: Option<String>,
    pub created_at: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ChatSession {
    pub id: String,
    pub tutor_id: String,
    pub user_id: Principal,
    pub topic: String,
    pub status: String, // "active", "completed", "archived"
    pub created_at: u64,
    pub updated_at: u64,
}

impl Storable for ChatSession {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(serde_cbor::to_vec(&self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        serde_cbor::from_slice(bytes.as_ref()).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ChatMessage {
    pub id: String,
    pub session_id: String,
    pub sender: String, // "user" or "tutor"
    pub content: String,
    pub timestamp: u64,
    pub has_audio: Option<bool>,
}

impl Storable for ChatMessage {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(serde_cbor::to_vec(&self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        serde_cbor::from_slice(bytes.as_ref()).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

// Wrapper type for Vec<ChatMessage> to implement Storable
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatMessageList(pub Vec<ChatMessage>);

impl Storable for ChatMessageList {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(serde_cbor::to_vec(&self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        serde_cbor::from_slice(bytes.as_ref()).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct KnowledgeBaseFile {
    pub id: u64,
    pub public_id: String,
    pub tutor_id: u64,
    pub user_id: Principal,
    pub file_name: String,
    pub file_size: u64,
    pub file_type: String,
    pub chunks_processed: u32,
    pub processing_time: f64,
    pub status: String, // "completed", "failed", "processing"
    pub error_message: Option<String>,
    pub created_at: u64,
    pub updated_at: u64,
}

impl Storable for KnowledgeBaseFile {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(serde_cbor::to_vec(&self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        serde_cbor::from_slice(bytes.as_ref()).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct LearningProgress {
    pub id: u64,
    pub user_id: Principal,
    pub session_id: u64,
    pub course_id: u64,
    pub progress_percentage: f64,
    pub current_module_id: Option<u64>,
    pub current_subtopic: Option<String>,
    pub last_activity: u64,
    pub created_at: u64,
    pub updated_at: u64,
}

impl Storable for LearningProgress {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(serde_cbor::to_vec(&self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        serde_cbor::from_slice(bytes.as_ref()).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct LearningMetrics {
    pub id: u64,
    pub user_id: Principal,
    pub session_id: u64,
    pub date: String, // ISO date string
    pub time_spent_minutes: u32,
    pub messages_sent: u32,
    pub comprehension_scores: std::collections::HashMap<String, f64>,
    pub difficulty_adjustments: std::collections::HashMap<String, String>,
    pub created_at: u64,
    pub updated_at: u64,
}

impl Storable for LearningMetrics {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(serde_cbor::to_vec(&self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        serde_cbor::from_slice(bytes.as_ref()).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ModuleCompletion {
    pub id: u64,
    pub user_id: Principal,
    pub module_id: u64,
    pub completed: bool,
    pub completion_date: Option<u64>,
    pub created_at: u64,
    pub updated_at: u64,
}

impl Storable for ModuleCompletion {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(serde_cbor::to_vec(&self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        serde_cbor::from_slice(bytes.as_ref()).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TopicSuggestion {
    pub topic: String,
    pub description: String,
    pub difficulty: String, // "beginner", "intermediate", "advanced"
    pub expertise_area: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TopicValidation {
    pub is_relevant: bool,
    pub confidence: f64,
    pub reasoning: String,
    pub suggested_alternatives: Vec<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CourseOutline {
    pub title: String,
    pub description: String,
    pub learning_objectives: Vec<String>,
    pub estimated_duration: String,
    pub difficulty_level: String,
    pub modules: Vec<CourseModule>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ComprehensionAnalysis {
    pub comprehension_score: f64,
    pub difficulty_adjustment: String, // "simplify", "maintain", "deepen"
    pub timestamp: String,
} 