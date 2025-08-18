mod models;
mod state;

use models::user::{User, UserSettings};
use models::tutor::Tutor;
use state::{USERS, TUTORS, next_id};
use std::collections::HashMap;
use models::connections::{UserConnection, ConnectionRequest};
use state::{CONNECTIONS, CONNECTION_REQUESTS};
use candid::Principal;
use models::study_group::{StudyGroup, GroupMembership};
use state::{STUDY_GROUPS, GROUP_MEMBERSHIPS};
use models::gamification::{Task, UserTaskCompletion};
use state::{TASKS, USER_TASK_COMPLETIONS};
use ic_llm::Model;
use ic_stable_structures::{StableBTreeMap, memory_manager::MemoryId};
use std::cell::RefCell;

// Simple password hashing (in production, use proper crypto)
fn hash_password(password: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    password.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

fn verify_password(password: &str, hash: &str) -> bool {
    hash_password(password) == hash
}

#[ic_cdk::query]
fn get_self() -> Option<User> {
    let principal = ic_cdk::caller();
    USERS.with(|users| users.borrow().get(&principal))
}

#[ic_cdk::update]
fn create_user(username: String, email: String) -> User {
    let principal = ic_cdk::caller();
    
    // TODO: Add validation to ensure username and email are unique.

    let default_settings = UserSettings {
        learning_style: "visual".to_string(),
        preferred_language: "en".to_string(),
        difficulty_level: "intermediate".to_string(),
        daily_goal_hours: 1,
        two_factor_enabled: false,
        font_size: "medium".to_string(),
        contrast: "normal".to_string(),
        ai_interaction_style: "casual".to_string(),
        profile_visibility: "public".to_string(),
        activity_sharing: "connections".to_string(),
    };

    let new_user = User {
        id: principal,
        public_id: principal.to_string(), // Using principal as public_id for now
        email,
        username,
        first_name: None,
        last_name: None,
        is_active: true,
        is_verified: false, // Will be verified via email or other method
        created_at: ic_cdk::api::time(),
        updated_at: ic_cdk::api::time(),
        last_login: None,
        oauth_provider: None,
        oauth_id: None,
        avatar_url: None,
        bio: None,
        blockchain_wallet_address: None,
        blockchain_wallet_type: None,
        blockchain_wallet_connected_at: None,
        wallet_address: None,
        public_key: None,
        role: "user".to_string(),
        status: "active".to_string(),
        location: None,
        subscription: "free".to_string(),
        last_active: ic_cdk::api::time(),
        settings: default_settings,
        password_hash: None,
    };

    USERS.with(|users| {
        users.borrow_mut().insert(principal, new_user.clone());
    });

    new_user
}

#[ic_cdk::update]
fn register_user(username: String, email: String, password: String) -> Result<User, String> {
    // Check if email already exists
    let email_exists = USERS.with(|users| {
        users.borrow().values().any(|user| user.email == email)
    });
    
    if email_exists {
        return Err("Email already registered".to_string());
    }

    // Check if username already exists
    let username_exists = USERS.with(|users| {
        users.borrow().values().any(|user| user.username == username)
    });
    
    if username_exists {
        return Err("Username already taken".to_string());
    }

    let password_hash = hash_password(&password);
    
    // Generate a unique ID for traditional users
    let user_id = next_id("user");

    // Derive a deterministic 32-byte seed from user_id and create a valid unique Principal
    let mut seed = [0u8; 32];
    let user_id_bytes = user_id.to_be_bytes();
    seed[0..8].copy_from_slice(&user_id_bytes);
    seed[8..16].copy_from_slice(&user_id_bytes);
    seed[16..24].copy_from_slice(&user_id_bytes);
    seed[24..32].copy_from_slice(&user_id_bytes);
    let principal = Principal::self_authenticating(&seed);

    let default_settings = UserSettings {
        learning_style: "visual".to_string(),
        preferred_language: "en".to_string(),
        difficulty_level: "intermediate".to_string(),
        daily_goal_hours: 1,
        two_factor_enabled: false,
        font_size: "medium".to_string(),
        contrast: "normal".to_string(),
        ai_interaction_style: "casual".to_string(),
        profile_visibility: "public".to_string(),
        activity_sharing: "connections".to_string(),
    };

    let new_user = User {
        id: principal,
        public_id: user_id.to_string(),
        email,
        username,
        first_name: None,
        last_name: None,
        is_active: true,
        is_verified: false,
        created_at: ic_cdk::api::time(),
        updated_at: ic_cdk::api::time(),
        last_login: None,
        oauth_provider: None,
        oauth_id: None,
        avatar_url: None,
        bio: None,
        blockchain_wallet_address: None,
        blockchain_wallet_type: None,
        blockchain_wallet_connected_at: None,
        wallet_address: None,
        public_key: None,
        role: "user".to_string(),
        status: "active".to_string(),
        location: None,
        subscription: "free".to_string(),
        last_active: ic_cdk::api::time(),
        settings: default_settings,
        password_hash: Some(password_hash),
    };

    USERS.with(|users| {
        users.borrow_mut().insert(principal, new_user.clone());
    });

    Ok(new_user)
}

#[ic_cdk::update]
fn login_user(email: String, password: String) -> Result<User, String> {
    let user = USERS.with(|users| {
        users.borrow().values().find(|user| user.email == email).map(|user| user.clone())
    });

    match user {
        Some(user) => {
            if let Some(password_hash) = &user.password_hash {
                if verify_password(&password, password_hash) {
                    // Update last login
                    let mut updated_user = user.clone();
                    updated_user.last_login = Some(ic_cdk::api::time());
                    updated_user.last_active = ic_cdk::api::time();
                    
                    USERS.with(|users| {
                        users.borrow_mut().insert(user.id, updated_user.clone());
                    });
                    
                    Ok(updated_user)
                } else {
                    Err("Invalid password".to_string())
                }
            } else {
                Err("Account not set up for password authentication".to_string())
            }
        }
        None => Err("User not found".to_string())
    }
}

#[ic_cdk::query]
fn get_user_by_email(email: String) -> Option<User> {
    USERS.with(|users| {
        users.borrow().values().find(|user| user.email == email).map(|user| user.clone())
    })
}

#[ic_cdk::update]
fn create_tutor(
    name: String,
    description: String,
    teaching_style: String,
    personality: String,
    expertise: Vec<String>,
    knowledge_base: Option<Vec<String>>,
    voice_id: Option<String>,
    voice_settings: Option<HashMap<String, String>>,
    avatar_url: Option<String>,
) -> Result<Tutor, String> {
    let caller = ic_cdk::caller();
    
    // Validate required fields
    if name.trim().is_empty() {
        return Err("Name is required".to_string());
    }
    if description.trim().is_empty() {
        return Err("Description is required".to_string());
    }
    if teaching_style.trim().is_empty() {
        return Err("Teaching style is required".to_string());
    }
    if personality.trim().is_empty() {
        return Err("Personality is required".to_string());
    }
    
    // Validate expertise and knowledge_base
    let expertise = if expertise.is_empty() {
        return Err("At least one expertise area is required".to_string());
    } else {
        expertise
    };
    
    let knowledge_base = knowledge_base.unwrap_or_default();
    
    let tutor_id = next_id("tutor");

    let new_tutor = Tutor {
        id: tutor_id,
        public_id: tutor_id.to_string(),
        user_id: caller,
        name: name.trim().to_string(),
        description: description.trim().to_string(),
        teaching_style: teaching_style.trim().to_string(),
        personality: personality.trim().to_string(),
        expertise,
        knowledge_base,
        is_pinned: false,
        avatar_url,
        voice_id,
        voice_settings: voice_settings.unwrap_or_default(),
        created_at: ic_cdk::api::time(),
        updated_at: ic_cdk::api::time(),
    };

    TUTORS.with(|tutors| {
        tutors.borrow_mut().insert(tutor_id, new_tutor.clone());
    });

    Ok(new_tutor)
}

#[ic_cdk::query]
fn get_tutor(id: u64) -> Option<Tutor> {
    TUTORS.with(|tutors| tutors.borrow().get(&id))
}

#[ic_cdk::query]
fn get_tutor_by_public_id(public_id: String) -> Option<Tutor> {
    let caller = ic_cdk::caller();
    TUTORS.with(|tutors| {
        tutors
            .borrow()
            .iter()
            .find(|(_, tutor)| tutor.public_id == public_id && tutor.user_id == caller)
            .map(|(_, tutor)| tutor.clone())
    })
}

#[ic_cdk::update]
fn update_tutor(
    public_id: String,
    name: Option<String>,
    description: Option<String>,
    teaching_style: Option<String>,
    personality: Option<String>,
    expertise: Option<Vec<String>>,
    knowledge_base: Option<Vec<String>>,
    voice_id: Option<String>,
    voice_settings: Option<HashMap<String, String>>,
    avatar_url: Option<String>,
) -> Result<Tutor, String> {
    let caller = ic_cdk::caller();
    
    let mut tutor = TUTORS.with(|tutors| {
        tutors
            .borrow()
            .iter()
            .find(|(_, t)| t.public_id == public_id && t.user_id == caller)
            .map(|(id, t)| (id, t.clone()))
    }).ok_or("Tutor not found or you don't have permission to update it")?;
    
    // Update fields if provided
    if let Some(name) = name {
        if name.trim().is_empty() {
            return Err("Name cannot be empty".to_string());
        }
        tutor.1.name = name.trim().to_string();
    }
    
    if let Some(description) = description {
        if description.trim().is_empty() {
            return Err("Description cannot be empty".to_string());
        }
        tutor.1.description = description.trim().to_string();
    }
    
    if let Some(teaching_style) = teaching_style {
        if teaching_style.trim().is_empty() {
            return Err("Teaching style cannot be empty".to_string());
        }
        tutor.1.teaching_style = teaching_style.trim().to_string();
    }
    
    if let Some(personality) = personality {
        if personality.trim().is_empty() {
            return Err("Personality cannot be empty".to_string());
        }
        tutor.1.personality = personality.trim().to_string();
    }
    
    if let Some(expertise) = expertise {
        if expertise.is_empty() {
            return Err("At least one expertise area is required".to_string());
        }
        tutor.1.expertise = expertise;
    }
    
    if let Some(knowledge_base) = knowledge_base {
        tutor.1.knowledge_base = knowledge_base;
    }
    
    if let Some(voice_id) = voice_id {
        tutor.1.voice_id = Some(voice_id);
    }
    
    if let Some(voice_settings) = voice_settings {
        tutor.1.voice_settings = voice_settings;
    }
    
    if let Some(avatar_url) = avatar_url {
        tutor.1.avatar_url = Some(avatar_url);
    }
    
    tutor.1.updated_at = ic_cdk::api::time();
    
    // Update the tutor in storage
    TUTORS.with(|tutors| {
        tutors.borrow_mut().insert(tutor.0, tutor.1.clone());
    });
    
    Ok(tutor.1)
}

#[ic_cdk::update]
fn delete_tutor(public_id: String) -> Result<String, String> {
    let caller = ic_cdk::caller();
    
    let tutor_id = TUTORS.with(|tutors| {
        tutors
            .borrow()
            .iter()
            .find(|(_, t)| t.public_id == public_id && t.user_id == caller)
            .map(|(id, _)| id)
    }).ok_or("Tutor not found or you don't have permission to delete it")?;
    
    TUTORS.with(|tutors| {
        tutors.borrow_mut().remove(&tutor_id);
    });
    
    Ok("Tutor deleted successfully".to_string())
}

#[ic_cdk::update]
fn toggle_tutor_pin(public_id: String) -> Result<Tutor, String> {
    let caller = ic_cdk::caller();
    
    let mut tutor = TUTORS.with(|tutors| {
        tutors
            .borrow()
            .iter()
            .find(|(_, t)| t.public_id == public_id && t.user_id == caller)
            .map(|(id, t)| (id, t.clone()))
    }).ok_or("Tutor not found or you don't have permission to modify it")?;
    
    tutor.1.is_pinned = !tutor.1.is_pinned;
    tutor.1.updated_at = ic_cdk::api::time();
    
    // Update the tutor in storage
    TUTORS.with(|tutors| {
        tutors.borrow_mut().insert(tutor.0, tutor.1.clone());
    });
    
    Ok(tutor.1)
}

#[ic_cdk::query]
fn get_tutors() -> Vec<Tutor> {
    let caller = ic_cdk::caller();
    TUTORS.with(|tutors| {
        tutors
            .borrow()
            .iter()
            .filter(|(_, tutor)| tutor.user_id == caller)
            .map(|(_, tutor)| tutor.clone())
            .collect()
    })
}

#[ic_cdk::update]
fn send_connection_request(receiver_id: Principal, message: Option<String>) -> Result<ConnectionRequest, String> {
    let sender_id = ic_cdk::caller();
    if sender_id == receiver_id {
        return Err("Cannot send connection request to yourself.".to_string());
    }

    // TODO: Check if already connected or request already exists

    let request_id = next_id("connection_request");
    let new_request = ConnectionRequest {
        id: request_id,
        sender_id,
        receiver_id,
        status: "pending".to_string(),
        message,
        created_at: ic_cdk::api::time(),
        updated_at: ic_cdk::api::time(),
        responded_at: None,
    };

    CONNECTION_REQUESTS.with(|requests| {
        requests.borrow_mut().insert(request_id, new_request.clone());
    });

    Ok(new_request)
}

#[ic_cdk::update]
fn accept_connection_request(request_id: u64) -> Result<UserConnection, String> {
    let caller = ic_cdk::caller();
    
    let request = CONNECTION_REQUESTS.with(|requests| requests.borrow().get(&request_id))
        .ok_or("Connection request not found.".to_string())?;

    if request.receiver_id != caller {
        return Err("You are not authorized to accept this request.".to_string());
    }

    if request.status != "pending" {
        return Err("This request is no longer pending.".to_string());
    }

    // Update request status
    let updated_request = ConnectionRequest {
        status: "accepted".to_string(),
        responded_at: Some(ic_cdk::api::time()),
        ..request
    };
    CONNECTION_REQUESTS.with(|requests| {
        requests.borrow_mut().insert(request_id, updated_request);
    });

    // Create a new connection
    let connection_id = next_id("connection");
    let new_connection = UserConnection {
        id: connection_id,
        user1_id: request.sender_id,
        user2_id: request.receiver_id,
        status: "active".to_string(),
        created_at: ic_cdk::api::time(),
        updated_at: ic_cdk::api::time(),
    };

    CONNECTIONS.with(|connections| {
        connections.borrow_mut().insert(connection_id, new_connection.clone());
    });
    
    Ok(new_connection)
}

#[ic_cdk::query]
fn get_connections() -> Vec<UserConnection> {
    let caller = ic_cdk::caller();
    CONNECTIONS.with(|connections| {
        connections
            .borrow()
            .iter()
            .filter(|(_, conn)| conn.user1_id == caller || conn.user2_id == caller)
            .map(|(_, conn)| conn.clone())
            .collect()
    })
}

#[ic_cdk::update]
fn create_study_group(
    name: String,
    description: Option<String>,
    is_private: bool,
    max_members: u32,
    learning_level: String,
) -> Result<StudyGroup, String> {
    let caller = ic_cdk::caller();
    let group_id = next_id("study_group");

    let new_group = StudyGroup {
        id: group_id,
        public_id: group_id.to_string(),
        name,
        description,
        creator_id: caller,
        topic_id: None, // Can be set later
        is_private,
        max_members,
        learning_level,
        meeting_frequency: None,
        goals: None,
        created_at: ic_cdk::api::time(),
        updated_at: ic_cdk::api::time(),
    };

    STUDY_GROUPS.with(|groups| {
        groups.borrow_mut().insert(group_id, new_group.clone());
    });
    
    // Automatically add the creator as the first member and admin
    let membership_id = next_id("group_membership");
    let new_membership = GroupMembership {
        id: membership_id,
        user_id: caller,
        group_id,
        role: "admin".to_string(),
        status: "active".to_string(),
        joined_at: ic_cdk::api::time(),
        contributions: 0,
        last_active_at: Some(ic_cdk::api::time()),
    };

    GROUP_MEMBERSHIPS.with(|memberships| {
        memberships.borrow_mut().insert(membership_id, new_membership);
    });

    Ok(new_group)
}

#[ic_cdk::update]
fn join_study_group(group_id: u64) -> Result<GroupMembership, String> {
    let caller = ic_cdk::caller();
    
    // Check if group exists
    let _group = STUDY_GROUPS.with(|groups| groups.borrow().get(&group_id))
        .ok_or("Study group not found.".to_string())?;

    // TODO: Add checks for private groups, max members, etc.
    
    let membership_id = next_id("group_membership");
    let new_membership = GroupMembership {
        id: membership_id,
        user_id: caller,
        group_id,
        role: "member".to_string(),
        status: "active".to_string(),
        joined_at: ic_cdk::api::time(),
        contributions: 0,
        last_active_at: Some(ic_cdk::api::time()),
    };

    GROUP_MEMBERSHIPS.with(|memberships| {
        memberships.borrow_mut().insert(membership_id, new_membership.clone());
    });

    Ok(new_membership)
}

#[ic_cdk::query]
fn get_study_group(id: u64) -> Option<StudyGroup> {
    STUDY_GROUPS.with(|groups| groups.borrow().get(&id))
}

#[ic_cdk::update]
fn create_task(
    title: String,
    description: String,
    category: String,
    difficulty: String,
    token_reward: u32,
    points_reward: u32,
) -> Result<Task, String> {
    let caller = ic_cdk::caller();
    // TODO: Add check to ensure caller is an admin

    let task_id = next_id("task");
    let new_task = Task {
        id: task_id,
        public_id: task_id.to_string(),
        title,
        description,
        category,
        difficulty,
        token_reward,
        points_reward,
        requirements: None,
        is_active: true,
        is_repeatable: false,
        max_completions: 1,
        created_by: caller,
        created_at: ic_cdk::api::time(),
        expires_at: None,
        metadata: None,
    };

    TASKS.with(|tasks| {
        tasks.borrow_mut().insert(task_id, new_task.clone());
    });

    Ok(new_task)
}

#[ic_cdk::update]
fn complete_task(task_id: u64) -> Result<UserTaskCompletion, String> {
    let caller = ic_cdk::caller();
    
    let task = TASKS.with(|tasks| tasks.borrow().get(&task_id))
        .ok_or("Task not found.".to_string())?;

    // TODO: Add validation to check if user has already completed the task

    let completion_id = next_id("user_task_completion");
    let new_completion = UserTaskCompletion {
        id: completion_id,
        user_id: caller,
        task_id,
        completed_at: ic_cdk::api::time(),
        tokens_earned: task.token_reward,
        points_earned: task.points_reward,
        completion_count: 1,
        proof_data: None,
        metadata: None,
    };

    USER_TASK_COMPLETIONS.with(|completions| {
        completions.borrow_mut().insert(completion_id, new_completion.clone());
    });

    // TODO: Update user's token/point balance

    Ok(new_completion)
}

#[ic_cdk::query]
fn get_tasks() -> Vec<Task> {
    TASKS.with(|tasks| {
        tasks.borrow().iter().map(|(_, task)| task.clone()).collect()
    })
}

// --- Admin Methods ---

#[ic_cdk::query]
fn get_all_users_admin() -> Result<Vec<User>, String> {
    if !is_admin(ic_cdk::caller()) {
        return Err("Only admins can perform this action.".to_string());
    }
    Ok(USERS.with(|users| users.borrow().iter().map(|(_, user)| user.clone()).collect()))
}

#[ic_cdk::update]
fn update_user_status_admin(user_id: Principal, status: String) -> Result<User, String> {
    if !is_admin(ic_cdk::caller()) {
        return Err("Only admins can perform this action.".to_string());
    }
    
    USERS.with(|users| {
        let mut users_mut = users.borrow_mut();
        if let Some(mut user) = users_mut.get(&user_id) {
            user.status = status;
            users_mut.insert(user_id, user.clone());
            Ok(user)
        } else {
            Err("User not found.".to_string())
        }
    })
}

// --- Billing Methods (Placeholders) ---

// TODO: Implement full logic for creating subscription plans
#[ic_cdk::update]
fn create_subscription_plan_admin(/* params */) -> Result<(), String> {
    if !is_admin(ic_cdk::caller()) {
        return Err("Only admins can perform this action.".to_string());
    }
    // Placeholder
    Ok(())
}

// TODO: Implement logic for creating a new subscription (HTTPS outcall to Paystack)
#[ic_cdk::update]
fn create_subscription(/* params */) -> Result<(), String> {
    // Placeholder
    Ok(())
}


// --- Blockchain Methods (Placeholders) ---

// TODO: Implement logic for fetching wallet balance (HTTPS outcall to Sui network)
#[ic_cdk::query]
fn get_sui_wallet_balance(wallet_address: String) -> Result<u64, String> {
    // Placeholder
    Ok(0)
}

// TODO: Implement ZK proof verification logic
#[ic_cdk::update]
fn verify_zk_proof(/* params */) -> Result<bool, String> {
    // Placeholder
    Ok(true)
}

// --- Private Helper Functions ---

fn is_admin(principal: Principal) -> bool {
    USERS.with(|users| {
        if let Some(user) = users.borrow().get(&principal) {
            user.role == "admin"
        } else {
            false
        }
    })
}

// --- AI Topic Suggestions ---

#[derive(serde::Serialize, serde::Deserialize)]
struct TopicSuggestionsResponse {
    suggestions: Vec<TopicSuggestion>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, candid::CandidType)]
struct TopicSuggestion {
    topic: String,
    description: String,
    difficulty: String,
    expertise_area: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, candid::CandidType)]
struct TopicValidation {
    is_relevant: bool,
    confidence: f64,
    reasoning: String,
    suggested_alternatives: Vec<String>,
}

async fn call_icp_ai(prompt: &str) -> Result<String, String> {
    // Use the real AI service with proper error handling
    ic_cdk::println!("Calling AI with prompt: {}", prompt);
    
    let text = ic_llm::prompt(Model::Llama3_1_8B, prompt).await;
    ic_cdk::println!("AI response received, length: {}", text.len());
    
    if text.trim().is_empty() {
        ic_cdk::println!("AI returned empty response");
        return Err("AI service returned empty response".to_string());
    }
    
    Ok(text)
}

#[ic_cdk::update]
async fn get_ai_topic_suggestions(tutor_id: String) -> Result<Vec<TopicSuggestion>, String> {
    let caller = ic_cdk::caller();
    
    // Get the tutor to understand their expertise and personality
    let tutor = TUTORS.with(|tutors| {
        tutors
            .borrow()
            .iter()
            .find(|(_, t)| t.public_id == tutor_id && t.user_id == caller)
            .map(|(_, t)| t.clone())
    }).ok_or("Tutor not found or you don't have permission to access it")?;
    
    // Prepare a detailed prompt for better AI responses
    let prompt = format!(
        "You are an advisor helping suggest learning topics based on a tutor's expertise.

The tutor has the following expertise: {}
The tutor's teaching style is: {}
The tutor's personality is: {}
The tutor's description: {}

Generate a list of 6-8 specific topic suggestions that:
1. Are directly related to the tutor's areas of expertise
2. Vary in complexity (some beginner-friendly, some advanced)
3. Cover different aspects of the tutor's knowledge domains
4. Would make for meaningful learning sessions

Format your response as a JSON array of objects, each containing:
- topic: The suggested topic name (concise but descriptive)
- description: A 1-2 sentence description of what the learner would gain
- difficulty: \"beginner\", \"intermediate\", or \"advanced\"
- expertise_area: Which of the tutor's expertise areas this relates to most

Return ONLY the JSON array, no other text.

Example format:
[
  {{
    \"topic\": \"Introduction to Linear Algebra\",
    \"description\": \"Learn the fundamentals of vectors, matrices, and linear transformations\",
    \"difficulty\": \"beginner\",
    \"expertise_area\": \"Mathematics\"
  }}
]",
        tutor.expertise.join(", "),
        tutor.teaching_style,
        tutor.personality,
        tutor.description
    );
    
    // Call AI service
    let ai_response = call_icp_ai(&prompt).await?;
    ic_cdk::println!("Raw AI response: {}", ai_response);
    
    // Parse the JSON response - try direct array first, then wrapped object
    let suggestions: Vec<TopicSuggestion> = match serde_json::from_str(&ai_response) {
        Ok(direct_array) => direct_array,
        Err(e) => {
            ic_cdk::println!("Failed to parse as direct array: {}", e);
            // Try parsing as wrapped object
            let wrapped: TopicSuggestionsResponse = serde_json::from_str(&ai_response)
                .map_err(|e| format!("Failed to parse AI response: {}", e))?;
            wrapped.suggestions
        }
    };
    
    Ok(suggestions)
}

#[ic_cdk::update]
async fn validate_topic(tutor_id: String, topic: String) -> Result<TopicValidation, String> {
    let caller = ic_cdk::caller();
    
    // Get the tutor to understand their expertise
    let tutor = TUTORS.with(|tutors| {
        tutors
            .borrow()
            .iter()
            .find(|(_, t)| t.public_id == tutor_id && t.user_id == caller)
            .map(|(_, t)| t.clone())
    }).ok_or("Tutor not found or you don't have permission to access it")?;
    
    // Prepare a detailed validation prompt
    let prompt = format!(
        "You are an AI tutor assistant validating if a topic is relevant to a tutor's expertise.

Tutor Expertise Areas: {}
Topic to validate: {}

Analyze if this topic is relevant to the tutor's expertise areas. Consider:
1. Direct relevance to the expertise areas
2. Appropriate difficulty level for the tutor's teaching style
3. Whether the topic would make for a meaningful learning session

Return a JSON response with:
- is_relevant: true/false
- confidence: 0.0 to 1.0 (how confident you are in the assessment)
- reasoning: brief explanation of your assessment
- suggested_alternatives: array of 2-3 alternative topics if not relevant

Example format:
{{
  \"is_relevant\": true,
  \"confidence\": 0.85,
  \"reasoning\": \"This topic directly relates to the tutor's expertise in mathematics\",
  \"suggested_alternatives\": []
}}

Return ONLY valid JSON, no other text.",
        tutor.expertise.join(", "),
        topic
    );
    
    // Call Groq API for validation
    let validation_response = call_icp_ai(&prompt).await?;
    
    // Parse the JSON response
    let validation: TopicValidation = serde_json::from_str(&validation_response)
        .map_err(|e| format!("Failed to parse validation response: {}", e))?;
    
    Ok(validation)
}

// --- Chat Session Management ---

#[derive(serde::Serialize, serde::Deserialize, Clone, candid::CandidType)]
struct ChatMessage {
    id: String,
    session_id: String,
    sender: String, // "user" or "tutor"
    content: String,
    timestamp: u64,
    has_audio: Option<bool>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, candid::CandidType)]
struct ChatSession {
    id: String,
    tutor_id: String,
    user_id: Principal,
    topic: String,
    status: String, // "active", "completed", "archived"
    created_at: u64,
    updated_at: u64,
}

// Simple in-memory storage for chat (will be replaced with stable storage later)
thread_local! {
    static CHAT_SESSIONS: RefCell<std::collections::HashMap<String, ChatSession>> = RefCell::new(std::collections::HashMap::new());
    static CHAT_MESSAGES: RefCell<std::collections::HashMap<String, Vec<ChatMessage>>> = RefCell::new(std::collections::HashMap::new());
}

#[ic_cdk::update]
async fn send_tutor_message(session_id: String, content: String) -> Result<String, String> {
    let caller = ic_cdk::caller();
    
    // Verify session exists and user has access
    let session = CHAT_SESSIONS.with(|sessions| {
        sessions.borrow().get(&session_id).cloned()
    }).ok_or("Session not found")?;
    
    if session.user_id != caller {
        return Err("You don't have permission to access this session".to_string());
    }
    
    // Create user message
    let user_message = ChatMessage {
        id: format!("msg_{}", next_id("message")),
        session_id: session_id.clone(),
        sender: "user".to_string(),
        content: content.clone(),
        timestamp: ic_cdk::api::time(),
        has_audio: Some(false),
    };
    
    // Store user message
    CHAT_MESSAGES.with(|messages| {
        let mut messages = messages.borrow_mut();
        let session_messages = messages.entry(session_id.clone()).or_insert_with(Vec::new);
        session_messages.push(user_message);
    });
    
    // Generate AI response using the tutor's expertise
    let tutor = TUTORS.with(|tutors| {
        tutors.borrow().iter().find(|(_, t)| t.public_id == session.tutor_id).map(|(_, t)| t.clone())
    }).ok_or("Tutor not found")?;
    
    // Create AI prompt for tutor response
    let prompt = format!(
        "You are a tutor with expertise in: {}. Teaching style: {}. Personality: {}.
        
A student asks: \"{}\"

Provide a helpful, educational response that:
1. Directly addresses the student's question
2. Uses your expertise and teaching style
3. Maintains your personality
4. Is educational and informative
5. Encourages further learning

Keep your response concise but comprehensive (2-4 sentences).",
        tutor.expertise.join(", "),
        tutor.teaching_style,
        tutor.personality,
        content
    );
    
    // Get AI response
    let ai_response = call_icp_ai(&prompt).await?;
    
    // Create tutor message
    let tutor_message = ChatMessage {
        id: format!("msg_{}", next_id("message")),
        session_id: session_id.clone(),
        sender: "tutor".to_string(),
        content: ai_response,
        timestamp: ic_cdk::api::time(),
        has_audio: Some(false),
    };
    
    // Store tutor message
    CHAT_MESSAGES.with(|messages| {
        let mut messages = messages.borrow_mut();
        let session_messages = messages.entry(session_id.clone()).or_insert_with(Vec::new);
        session_messages.push(tutor_message.clone());
    });
    
    // Update session timestamp
    CHAT_SESSIONS.with(|sessions| {
        let mut sessions = sessions.borrow_mut();
        if let Some(session) = sessions.get_mut(&session_id) {
            session.updated_at = ic_cdk::api::time();
        }
    });
    
    Ok(tutor_message.id)
}

#[ic_cdk::query]
fn get_session_messages(session_id: String) -> Result<Vec<ChatMessage>, String> {
    let caller = ic_cdk::caller();
    
    // Verify session exists and user has access
    let session = CHAT_SESSIONS.with(|sessions| {
        sessions.borrow().get(&session_id).cloned()
    }).ok_or("Session not found")?;
    
    if session.user_id != caller {
        return Err("You don't have permission to access this session".to_string());
    }
    
    // Get messages for the session
    let messages = CHAT_MESSAGES.with(|messages| {
        messages.borrow().get(&session_id).cloned().unwrap_or_default()
    });
    
    Ok(messages)
}

#[ic_cdk::query]
fn get_session_progress(session_id: String) -> Result<ProgressUpdate, String> {
    let caller = ic_cdk::caller();
    
    // Verify session exists and user has access
    let session = CHAT_SESSIONS.with(|sessions| {
        sessions.borrow().get(&session_id).cloned()
    }).ok_or("Session not found")?;
    
    if session.user_id != caller {
        return Err("You don't have permission to access this session".to_string());
    }
    
    // For now, return a simple progress update
    // In a real implementation, you'd track actual progress
    let progress = ProgressUpdate {
        session_id: session_id.clone(),
        user_id: caller.to_string(),
        progress: ProgressData {
            id: 1,
            user_id: caller.to_string(),
            session_id: session_id,
            course_id: 1,
            current_module_id: Some(1),
            progress_percentage: 50.0,
            last_activity: ic_cdk::api::time().to_string(),
        }
    };
    
    Ok(progress)
}

#[derive(serde::Serialize, serde::Deserialize, Clone, candid::CandidType)]
struct ProgressUpdate {
    session_id: String,
    user_id: String,
    progress: ProgressData,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, candid::CandidType)]
struct ProgressData {
    id: u64,
    user_id: String,
    session_id: String,
    course_id: u64,
    current_module_id: Option<u64>,
    progress_percentage: f64,
    last_activity: String,
}

// --- Candid Generation ---
ic_cdk::export_candid!();
