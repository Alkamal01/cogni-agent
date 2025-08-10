use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use ic_stable_structures::storable::{Storable, Bound};
use std::borrow::Cow;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct User {
    pub id: Principal,
    pub public_id: String,
    pub email: String,
    pub username: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub is_active: bool,
    pub is_verified: bool,
    pub created_at: u64,
    pub updated_at: u64,
    pub last_login: Option<u64>,
    pub oauth_provider: Option<String>,
    pub oauth_id: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub blockchain_wallet_address: Option<String>,
    pub blockchain_wallet_type: Option<String>,
    pub blockchain_wallet_connected_at: Option<u64>,
    pub wallet_address: Option<String>, // Sui wallet
    pub public_key: Option<String>, // Sui public key
    pub role: String, // "user", "tutor", "admin"
    pub status: String, // "active", "inactive", "suspended"
    pub location: Option<String>,
    pub subscription: String, // "free", "pro", "enterprise"
    pub last_active: u64,
    pub settings: UserSettings,
    pub password_hash: Option<String>, // For traditional email/password auth
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UserSettings {
    // Learning Preferences
    pub learning_style: String,
    pub preferred_language: String,
    pub difficulty_level: String,
    pub daily_goal_hours: u8,
    // Security Settings
    pub two_factor_enabled: bool,
    // Accessibility Settings
    pub font_size: String,
    pub contrast: String,
    // AI Settings
    pub ai_interaction_style: String,
    // Privacy Settings
    pub profile_visibility: String,
    pub activity_sharing: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct LoginHistory {
    pub timestamp: u64,
    pub ip_address: String,
    pub location: Option<String>,
    pub device: Option<String>,
    pub status: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct LoginSession {
    pub device: Option<String>,
    pub ip_address: String,
    pub location: Option<String>,
    pub created_at: u64,
    pub last_active: u64,
    pub is_active: bool,
}

impl Storable for User {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(serde_cbor::to_vec(&self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        serde_cbor::from_slice(bytes.as_ref()).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
} 