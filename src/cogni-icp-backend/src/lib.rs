mod models;
mod state;

use models::user::{User, UserSettings};
use models::tutor::{Tutor, ChatSession, ChatMessage, ChatMessageList, LearningProgress, LearningMetrics, ModuleCompletion, KnowledgeBaseFile, CourseOutline, ComprehensionAnalysis, TopicSuggestion, TopicValidation};
use state::{USERS, TUTORS, CHAT_SESSIONS, CHAT_MESSAGES, LEARNING_PROGRESS, LEARNING_METRICS, MODULE_COMPLETIONS, KNOWLEDGE_BASE_FILES, next_id};
use std::collections::HashMap;
use models::connections::{UserConnection, ConnectionRequest};
use state::{CONNECTIONS, CONNECTION_REQUESTS};
use candid::Principal;
use models::study_group::{StudyGroup, GroupMembership};
use state::{STUDY_GROUPS, GROUP_MEMBERSHIPS};
use models::gamification::{Task, UserTaskCompletion};
use state::{TASKS, USER_TASK_COMPLETIONS};
use ic_stable_structures::{StableBTreeMap, memory_manager::MemoryId};
use std::cell::RefCell;
use serde_json::json;
use ic_cdk::api::management_canister::http_request::{http_request, CanisterHttpRequestArgument, HttpMethod, HttpResponse, TransformArgs};

// Simple password hashing (in production, use proper crypto)
fn hash_password(password: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    password.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

// Generate a secure random string ID
fn generate_secure_id() -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    // Use current time and a random component to generate a unique ID
    let timestamp = ic_cdk::api::time();
    let mut hasher = DefaultHasher::new();
    timestamp.hash(&mut hasher);
    
    // Add some randomness by hashing the timestamp multiple times
    let hash1 = hasher.finish();
    let mut hasher2 = DefaultHasher::new();
    hash1.hash(&mut hasher2);
    let hash2 = hasher2.finish();
    
    // Convert to a base36 string for better readability and shorter length
    format!("tutor_{:x}", hash2)
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
fn upsert_external_user(
    email: String,
    username: Option<String>,
    first_name: Option<String>,
    last_name: Option<String>,
    avatar_url: Option<String>,
    is_verified: Option<bool>,
) -> User {
    // Try to find an existing user by email
    let existing = USERS.with(|users| {
        users
            .borrow()
            .values()
            .find(|user| user.email == email)
            .cloned()
    });

    match existing {
        Some(mut user) => {
            if let Some(u) = username { if !u.trim().is_empty() { user.username = u; } }
            if let Some(f) = first_name { if !f.trim().is_empty() { user.first_name = Some(f); } }
            if let Some(l) = last_name { if !l.trim().is_empty() { user.last_name = Some(l); } }
            if let Some(a) = avatar_url { if !a.trim().is_empty() { user.avatar_url = Some(a); } }
            if let Some(v) = is_verified { user.is_verified = v; }
            user.updated_at = ic_cdk::api::time();
            user.last_active = ic_cdk::api::time();

            USERS.with(|users| {
                users.borrow_mut().insert(user.id, user.clone());
            });
            user
        }
        None => {
            // Create a new external user without password
            let user_id = next_id("user");

            // Derive a deterministic 32-byte seed from user_id and create a unique Principal
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

            let derived_username = username.unwrap_or_else(|| {
                let at = email.find('@').unwrap_or(0);
                if at > 0 { email[..at].to_string() } else { email.clone() }
            });

            let new_user = User {
                id: principal,
                public_id: user_id.to_string(),
                email,
                username: derived_username,
                first_name,
                last_name,
                is_active: true,
                is_verified: is_verified.unwrap_or(true),
                created_at: ic_cdk::api::time(),
                updated_at: ic_cdk::api::time(),
                last_login: Some(ic_cdk::api::time()),
                oauth_provider: Some("python".to_string()),
                oauth_id: None,
                avatar_url,
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
    }
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
    
    // Generate a secure random string for public_id
    let public_id = generate_secure_id();

    let new_tutor = Tutor {
        id: tutor_id,
        public_id: public_id,
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

async fn call_groq_ai(prompt: &str) -> Result<String, String> {
    ic_cdk::println!("Calling Groq AI with prompt: {}", prompt);
    
    // Use the hardcoded API key
    let api_key = "REDACTED_GROQ_KEY";
    
    let request_body = json!({
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7,
        "max_tokens": 200,
        "stream": false
    });
    
    let request = CanisterHttpRequestArgument {
        method: HttpMethod::POST,
        url: "https://api.groq.com/openai/v1/chat/completions".to_string(),
        headers: vec![
            ic_cdk::api::management_canister::http_request::HttpHeader {
                name: "Authorization".to_string(),
                value: format!("Bearer {}", api_key),
            },
            ic_cdk::api::management_canister::http_request::HttpHeader {
                name: "Content-Type".to_string(),
                value: "application/json".to_string(),
            },
        ],
        body: Some(serde_json::to_vec(&request_body).unwrap()),
        max_response_bytes: Some(2000),
        transform: None,
    };
    
    // Enhanced retry logic with exponential backoff for IC consensus issues
    let max_retries = 3; // Keep retries reasonable
    for attempt in 1..=max_retries {
        ic_cdk::println!("Groq API attempt {}/{}", attempt, max_retries);
        
        // Add delay between retries by making multiple small operations
        if attempt > 1 {
            ic_cdk::println!("Waiting before retry...");
            // Create some work to introduce delay
            let _ = (0..attempt * 1000).fold(0, |acc, _| acc + 1);
        }
        
        match http_request(request.clone(), 5_000_000_000).await {
            Ok((response,)) => {
                if response.status == 200u32 {
                    let response_text = String::from_utf8(response.body)
                        .map_err(|e| format!("Failed to parse response body: {}", e))?;
                    
                    let groq_response: serde_json::Value = serde_json::from_str(&response_text)
                        .map_err(|e| format!("Failed to parse Groq response: {}", e))?;
                    
                    if let Some(choices) = groq_response["choices"].as_array() {
                        if let Some(first_choice) = choices.first() {
                            if let Some(content) = first_choice["message"]["content"].as_str() {
                                ic_cdk::println!("Groq AI response received, length: {}", content.len());
                                return Ok(content.to_string());
                            }
                        }
                    }
                    
                    return Err("Groq API returned no valid content".to_string());
                } else {
                    ic_cdk::println!("Groq API error: {}", response.status);
                    if attempt == max_retries {
                        return Err(format!("Groq API error: {}", response.status));
                    }
                }
            }
            Err((code, message)) => {
                ic_cdk::println!("HTTP request failed (attempt {}/{}): {:?} - {}", attempt, max_retries, code, message);
                
                // Check if it's a consensus error specifically
                let is_consensus_error = message.contains("SysTransient") || message.contains("consensus");
                
                if attempt < max_retries && is_consensus_error {
                    ic_cdk::println!("Consensus error detected, retrying...");
                    continue;
                } else if attempt < max_retries {
                    ic_cdk::println!("Non-consensus error, retrying...");
                    continue;
                } else {
                    return Err(format!("HTTP request failed after {} attempts: {:?} - {}", max_retries, code, message));
                }
            }
        }
    }
    
    // If all retries failed, provide a fallback response
    ic_cdk::println!("Groq API failed after all retries, using fallback response");
    Ok(format!("I apologize, but I'm experiencing technical difficulties with my AI service right now. However, I can still help you with your question: \"{}\" Please try asking me again in a moment, or feel free to rephrase your question.", prompt))
}

// Enhanced AI functions for comprehensive tutoring
async fn generate_course_outline(tutor_data: &Tutor, topic: &str, user_preferences: &UserSettings) -> Result<CourseOutline, String> {
    let learning_style = &user_preferences.learning_style;
    let difficulty = &user_preferences.difficulty_level;
    
    let system_prompt = format!(
        "Create a course outline on '{}' for {} learning at {} level.
        
        Return JSON:
        {{\"title\":\"Course Title\",\"description\":\"Brief description\",\"learning_objectives\":[\"obj1\",\"obj2\"],\"estimated_duration\":\"X weeks\",\"difficulty_level\":\"{}\",\"modules\":[{{\"title\":\"Module\",\"description\":\"Brief\",\"order\":1,\"content\":\"Content\",\"status\":\"pending\"}}]}}
        
        Keep descriptions under 100 chars. Max 3 modules.",
        topic,
        learning_style,
        difficulty,
        difficulty
    );
    
    let ai_response = call_groq_ai(&system_prompt).await?;
    
    // Parse the JSON response
    match serde_json::from_str::<CourseOutline>(&ai_response) {
        Ok(outline) => Ok(outline),
        Err(_) => {
            // Fallback if JSON parsing fails
            Ok(CourseOutline {
                title: format!("Course on {}", topic),
                description: format!("A comprehensive course about {}", topic),
                learning_objectives: vec![format!("Understand the basics of {}", topic)],
                estimated_duration: "4 weeks".to_string(),
                difficulty_level: difficulty.clone(),
                modules: vec![
                    models::tutor::CourseModule {
                        id: 1,
                        title: "Introduction".to_string(),
                        description: format!("Introduction to {}", topic),
                        order: 1,
                        content: Some(format!("Learn the fundamentals of {}", topic)),
                        status: "pending".to_string(),
                    }
                ],
            })
        }
    }
}

async fn generate_topic_suggestions(tutor_data: &Tutor) -> Result<Vec<TopicSuggestion>, String> {
    let system_prompt = format!(
        "Generate 3 topic suggestions for a tutor with expertise in: {}
        Teaching style: {}
        
        Return JSON array:
        [{{\"topic\":\"Name\",\"description\":\"Brief description\",\"difficulty\":\"beginner/intermediate/advanced\",\"expertise_area\":\"area\"}}]
        
        Keep descriptions under 50 chars.",
        tutor_data.expertise.join(", "),
        tutor_data.teaching_style
    );
    
    let ai_response = call_groq_ai(&system_prompt).await?;
    
    match serde_json::from_str::<Vec<TopicSuggestion>>(&ai_response) {
        Ok(suggestions) => {
            // Ensure we don't exceed 3 suggestions to keep response small
            Ok(suggestions.into_iter().take(3).collect())
        },
        Err(e) => {
            ic_cdk::println!("Failed to parse AI response: {}, using fallback", e);
            // Fallback suggestions based on expertise
            Ok(tutor_data.expertise.iter().take(3).map(|exp| TopicSuggestion {
                topic: format!("Introduction to {}", exp),
                description: format!("Learn the basics of {}", exp),
                difficulty: "beginner".to_string(),
                expertise_area: exp.clone(),
            }).collect())
        }
    }
}

async fn validate_topic(tutor_data: &Tutor, topic: &str) -> Result<TopicValidation, String> {
    let system_prompt = format!(
        "Evaluate if the topic '{}' is relevant to a tutor with expertise in: {}
        
        Return a JSON object:
        {{
          \"is_relevant\": true/false,
          \"confidence\": 0.0-1.0,
          \"reasoning\": \"Brief explanation\",
          \"suggested_alternatives\": [\"alt1\", \"alt2\", \"alt3\"] (only if not relevant)
        }}
        
        Return ONLY the JSON object.",
        topic,
        tutor_data.expertise.join(", ")
    );
    
    let ai_response = call_groq_ai(&system_prompt).await?;
    
    match serde_json::from_str::<TopicValidation>(&ai_response) {
        Ok(validation) => Ok(validation),
        Err(_) => {
            // Fallback validation
            let is_relevant = tutor_data.expertise.iter().any(|exp| topic.to_lowercase().contains(&exp.to_lowercase()));
            Ok(TopicValidation {
                is_relevant,
                confidence: if is_relevant { 0.7 } else { 0.3 },
                reasoning: "Fallback validation based on keyword matching".to_string(),
                suggested_alternatives: if is_relevant { vec![] } else { tutor_data.expertise.clone() },
            })
        }
    }
}

async fn generate_tutor_chat_response(
    session_id: &str,
    user_message: &str,
    session_history: &[ChatMessage],
    tutor_data: &Tutor,
    user_preferences: &UserSettings,
) -> Result<(String, ComprehensionAnalysis), String> {
    let learning_style = &user_preferences.learning_style;
    let ai_style = &user_preferences.ai_interaction_style;
    
    // Build context from session history (limit to last 3 messages)
    let mut context = String::new();
    for msg in session_history.iter().rev().take(3) {
        context.push_str(&format!("{}: {}\n", msg.sender, msg.content));
    }
    
    let system_prompt = format!(
        "You are {} an AI tutor. Teaching style: {}. Student: {}.
        
        Context: {}
        Student: {}
        
        Respond briefly and helpfully. Use emojis! Keep under 200 chars.",
        tutor_data.name,
        tutor_data.teaching_style,
        learning_style,
        context,
        user_message
    );
    
    let ai_response = call_groq_ai(&system_prompt).await?;
    
    // Simple comprehension analysis
    let comprehension_score = if user_message.len() > 50 { 0.7 } else { 0.5 };
    let difficulty_adjustment = if comprehension_score > 0.6 { "maintain" } else { "simplify" };
    
    let analysis = ComprehensionAnalysis {
        comprehension_score,
        difficulty_adjustment: difficulty_adjustment.to_string(),
        timestamp: ic_cdk::api::time().to_string(),
    };
    
    Ok((ai_response, analysis))
}

async fn generate_welcome_message(tutor_data: &Tutor, topic: &str, course_outline: Option<&CourseOutline>) -> Result<String, String> {
    let system_prompt = format!(
        "You are {} an AI tutor with expertise in {}. Your teaching style is {} and your personality is {}.
        
        Write a warm, personalized welcome message to a student who wants to learn about '{}'.
        
        Your message should:
        1. Introduce yourself briefly as the tutor
        2. Show enthusiasm for teaching the topic
        3. Mention that you've created a customized course outline
        4. Invite the student to begin their learning journey
        5. Ask what they would like to start with
        
        Make your message:
        - Friendly and conversational, not formal
        - Reflect your specific personality ({}) and teaching style ({})
        - Between 3-5 sentences (concise but welcoming)
        - Encouraging and positive
        - Use emojis to make it engaging! 🎉
        
        DO NOT include any markdown, quotes, or extra formatting.",
        tutor_data.name,
        tutor_data.expertise.join(", "),
        tutor_data.teaching_style,
        tutor_data.personality,
        topic,
        tutor_data.personality,
        tutor_data.teaching_style
    );
    
    call_groq_ai(&system_prompt).await
}

// Groq API is now configured by default - no user configuration needed

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
    
    // Prepare a simplified prompt for better reliability
    let prompt = format!(
        "Expertise: {}. Style: {}. Personality: {}.

Suggest 3 learning topics as JSON array:
[{{\"topic\": \"Topic Name\", \"description\": \"Brief description\", \"difficulty\": \"beginner\", \"expertise_area\": \"Area\"}}]",
        tutor.expertise.join(", "),
        tutor.teaching_style,
        tutor.personality
    );
    
    // Call AI service
    let ai_response = call_groq_ai(&prompt).await?;
    ic_cdk::println!("Raw AI response: {}", ai_response);
    
    // Parse the JSON response
    let suggestions: Vec<TopicSuggestion> = serde_json::from_str(&ai_response)
        .map_err(|e| format!("Failed to parse AI response: {}", e))?;
    
    Ok(suggestions)
}

// Duplicate function removed - using the enhanced version below

// --- Test Methods ---

#[ic_cdk::update]
async fn test_groq_api() -> Result<String, String> {
    let prompt = "Say 'Hello from Groq!' in exactly 5 words.";
    call_groq_ai(&prompt).await
}

// --- Chat Session Management ---

// ChatMessage is now defined in models/tutor.rs

// ChatSession is now defined in models/tutor.rs

// Simple in-memory storage for chat (will be replaced with stable storage later)
// Chat sessions and messages are now stored in stable memory via state.rs

#[ic_cdk::update]
async fn send_tutor_message(session_id: String, content: String) -> Result<String, String> {
    let caller = ic_cdk::caller();
    
    // Verify session exists and user has access
    let session = CHAT_SESSIONS.with(|sessions| {
        sessions.borrow().get(&session_id)
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
        let mut session_messages = messages.get(&session_id).unwrap_or_else(|| ChatMessageList(Vec::new()));
        session_messages.0.push(user_message);
        messages.insert(session_id.clone(), session_messages);
    });
    
    // Generate AI response using the tutor's expertise
    let tutor = TUTORS.with(|tutors| {
        tutors.borrow().iter().find(|(_, t)| t.public_id == session.tutor_id).map(|(_, t)| t.clone())
    }).ok_or("Tutor not found")?;
    
    // Create AI prompt for tutor response
    let prompt = format!(
        "Expert in: {}. Style: {}. Personality: {}.
        
Student: \"{}\"

Give a helpful, educational response in 2-3 sentences.",
        tutor.expertise.join(", "),
        tutor.teaching_style,
        tutor.personality,
        content
    );
    
    // Get AI response
    let ai_response = call_groq_ai(&prompt).await?;
    
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
        let mut session_messages = messages.get(&session_id).unwrap_or_else(|| ChatMessageList(Vec::new()));
        session_messages.0.push(tutor_message.clone());
        messages.insert(session_id.clone(), session_messages);
    });
    
    // Update session timestamp
    CHAT_SESSIONS.with(|sessions| {
        let mut sessions = sessions.borrow_mut();
        if let Some(mut session) = sessions.get(&session_id) {
            session.updated_at = ic_cdk::api::time();
            sessions.insert(session_id.clone(), session);
        }
    });
    
    Ok(tutor_message.id)
}

#[ic_cdk::query]
fn get_session_messages(session_id: String) -> Result<Vec<ChatMessage>, String> {
    let caller = ic_cdk::caller();
    
    // Verify session exists and user has access
    let session = CHAT_SESSIONS.with(|sessions| {
        sessions.borrow().get(&session_id)
    }).ok_or("Session not found")?;
    
    if session.user_id != caller {
        return Err("You don't have permission to access this session".to_string());
    }
    
    // Get messages for the session
    let messages = CHAT_MESSAGES.with(|messages| {
        messages.borrow().get(&session_id).map(|list| list.0).unwrap_or_default()
    });
    
    Ok(messages)
}

#[ic_cdk::query]
fn get_session_progress(session_id: String) -> Result<ProgressUpdate, String> {
    let caller = ic_cdk::caller();
    
    // Verify session exists and user has access
    let session = CHAT_SESSIONS.with(|sessions| {
        sessions.borrow().get(&session_id)
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
            progress_percentage: 0.0, // Start at 0%
            last_activity: ic_cdk::api::time().to_string(),
        }
    };
    
    Ok(progress)
}

#[ic_cdk::query]
fn get_chat_session(session_id: String) -> Result<ChatSession, String> {
    let caller = ic_cdk::caller();
    
    ic_cdk::println!("Getting chat session: {} for caller: {}", session_id, caller);
    
    // Get the session
    let session = CHAT_SESSIONS.with(|sessions| {
        let sessions = sessions.borrow();
        ic_cdk::println!("Available sessions: {:?}", sessions.keys().collect::<Vec<_>>());
        sessions.get(&session_id)
    }).ok_or("Session not found")?;
    
    // Verify user has access to this session
    if session.user_id != caller {
        ic_cdk::println!("Access denied: session user {} != caller {}", session.user_id, caller);
        return Err("You don't have permission to access this session".to_string());
    }
    
    ic_cdk::println!("Successfully retrieved session: {:?}", session);
    Ok(session)
}

#[ic_cdk::query]
fn get_user_sessions() -> Result<Vec<ChatSession>, String> {
    let caller = ic_cdk::caller();
    
    ic_cdk::println!("Getting all sessions for user: {}", caller);
    
    // Get all sessions for the current user
    let user_sessions = CHAT_SESSIONS.with(|sessions| {
        let sessions = sessions.borrow();
        sessions.iter()
            .filter(|(_, session)| session.user_id == caller)
            .map(|(_, session)| session.clone())
            .collect::<Vec<_>>()
    });
    
    ic_cdk::println!("Found {} sessions for user", user_sessions.len());
    Ok(user_sessions)
}

#[ic_cdk::update]
async fn generate_course_modules(session_id: String) -> Result<Vec<String>, String> {
    let caller = ic_cdk::caller();
    
    // Get the session
    let session = CHAT_SESSIONS.with(|sessions| {
        sessions.borrow().get(&session_id)
    }).ok_or("Session not found")?;
    
    // Verify user has access to this session
    if session.user_id != caller {
        return Err("You don't have permission to access this session".to_string());
    }
    
    // Get tutor information
    let tutor = TUTORS.with(|tutors| {
        tutors.borrow().iter().find(|(_, t)| t.public_id == session.tutor_id).map(|(_, t)| t.clone())
    }).ok_or("Tutor not found")?;
    
    ic_cdk::println!("Generating modules for topic: {}", session.topic);
    ic_cdk::println!("Tutor expertise: {}", tutor.expertise.join(", "));
    
    // Create AI prompt for module generation
    let prompt = format!(
        "Generate 5 learning module titles for teaching '{}'. 
        Tutor expertise: {}. Teaching style: {}. Personality: {}.
        
        Return ONLY a JSON array of strings with module titles.
        Example: [\"Introduction to Calculus\", \"Derivatives and Limits\", \"Integration Basics\", \"Applications\", \"Advanced Topics\"]
        
        Make sure the modules are:
        1. Relevant to the topic
        2. Progressive in difficulty
        3. Practical and actionable
        4. Aligned with the tutor's expertise and teaching style",
        session.topic,
        tutor.expertise.join(", "),
        tutor.teaching_style,
        tutor.personality
    );
    
    // Call AI to generate modules with fallback
    let ai_response = match call_groq_ai(&prompt).await {
        Ok(response) => {
            ic_cdk::println!("Raw AI response for modules: {}", response);
            response
        },
        Err(e) => {
            ic_cdk::println!("AI call failed: {}, using fallback modules", e);
            // Generate fallback modules based on topic and tutor expertise
            let fallback_modules = vec![
                format!("Introduction to {}", session.topic),
                format!("{} Fundamentals", session.topic),
                format!("Advanced {} Concepts", session.topic),
                format!("{} Applications", session.topic),
                format!("{} Mastery", session.topic),
            ];
            ic_cdk::println!("Using fallback modules: {:?}", fallback_modules);
            return Ok(fallback_modules);
        }
    };
    
    // Try multiple parsing strategies
    let module_titles: Vec<String> = {
        // Strategy 1: Direct JSON array
        if let Ok(titles) = serde_json::from_str::<Vec<String>>(&ai_response) {
            ic_cdk::println!("Successfully parsed as direct JSON array");
            titles
        }
        // Strategy 2: Clean the response and try again
        else {
            let cleaned_response = ai_response
                .lines()
                .filter(|line| {
                    let trimmed = line.trim();
                    trimmed.starts_with('[') || trimmed.starts_with('"') || trimmed.contains('"')
                })
                .collect::<Vec<_>>()
                .join("\n");
            
            ic_cdk::println!("Cleaned response: {}", cleaned_response);
            
            if let Ok(titles) = serde_json::from_str::<Vec<String>>(&cleaned_response) {
                ic_cdk::println!("Successfully parsed cleaned response");
                titles
            }
            // Strategy 3: Extract JSON from markdown or other wrappers
            else if let Some(start) = ai_response.find('[') {
                if let Some(end) = ai_response.rfind(']') {
                    let json_part = &ai_response[start..=end];
                    ic_cdk::println!("Extracted JSON part: {}", json_part);
                    serde_json::from_str::<Vec<String>>(json_part)
                        .map_err(|e| format!("Failed to parse extracted JSON: {}", e))?
                } else {
                    return Err(format!("Could not find closing bracket in AI response: {}", ai_response));
                }
            }
            // Strategy 4: Try to extract individual strings
            else {
                let mut titles = Vec::new();
                let lines: Vec<&str> = ai_response.lines().collect();
                for line in lines {
                    let trimmed = line.trim();
                    if trimmed.starts_with('"') && trimmed.ends_with('"') {
                        if let Ok(title) = serde_json::from_str::<String>(trimmed) {
                            titles.push(title);
                        }
                    }
                }
                
                if titles.is_empty() {
                    return Err(format!("Could not extract any valid module titles from AI response: {}", ai_response));
                }
                
                ic_cdk::println!("Extracted {} titles from individual lines", titles.len());
                titles
            }
        }
    };
    
    if module_titles.is_empty() {
        return Err("No valid modules generated from AI response".to_string());
    }
    
    ic_cdk::println!("Successfully generated {} modules: {:?}", module_titles.len(), module_titles);
    Ok(module_titles)
}

// Duplicate function removed - using the enhanced async version above

#[ic_cdk::update]
async fn create_chat_session(tutor_id: String, topic: String) -> Result<String, String> {
    let caller = ic_cdk::caller();
    
    ic_cdk::println!("Creating chat session for tutor: {}, topic: {}, caller: {}", tutor_id, topic, caller);
    
    // Verify the tutor exists and user has access
    let tutor = TUTORS.with(|tutors| {
        tutors.borrow().iter().find(|(_, t)| t.public_id == tutor_id).map(|(_, t)| t.clone())
    }).ok_or("Tutor not found")?;
    
    ic_cdk::println!("Found tutor: {:?}", tutor);
    
    // Create a new chat session with a simple ID
    let session_id = format!("session_{}", ic_cdk::api::time());
    let session = ChatSession {
        id: session_id.clone(),
        tutor_id: tutor_id.clone(),
        user_id: caller,
        topic: topic.clone(),
        status: "active".to_string(),
        created_at: ic_cdk::api::time(),
        updated_at: ic_cdk::api::time(),
    };
    
    ic_cdk::println!("Created session: {:?}", session);
    
    // Store the session
    CHAT_SESSIONS.with(|sessions| {
        sessions.borrow_mut().insert(session_id.clone(), session);
    });
    
    // Create a personalized welcome message from the tutor
    let welcome_content = generate_welcome_message(&tutor, &topic, None).await?;
    let welcome_message = ChatMessage {
        id: format!("welcome_{}", ic_cdk::api::time()),
        session_id: session_id.clone(),
        sender: "tutor".to_string(),
        content: welcome_content,
        timestamp: ic_cdk::api::time(),
        has_audio: Some(false),
    };
    
    // Initialize messages with the welcome message
    CHAT_MESSAGES.with(|messages| {
        messages.borrow_mut().insert(session_id.clone(), ChatMessageList(vec![welcome_message]));
    });
    
    ic_cdk::println!("Session stored successfully with ID: {} and welcome message", session_id);
    Ok(session_id)
}

#[ic_cdk::update]
async fn delete_chat_session(session_id: String) -> Result<String, String> {
    let caller = ic_cdk::caller();
    
    ic_cdk::println!("Deleting chat session: {}, caller: {}", session_id, caller);
    
    // Verify session exists and user has access
    let session = CHAT_SESSIONS.with(|sessions| {
        sessions.borrow().get(&session_id)
    }).ok_or("Session not found")?;
    
    if session.user_id != caller {
        return Err("You don't have permission to delete this session".to_string());
    }
    
    // Remove the session from storage
    CHAT_SESSIONS.with(|sessions| {
        sessions.borrow_mut().remove(&session_id);
    });
    
    // Remove the messages for this session
    CHAT_MESSAGES.with(|messages| {
        messages.borrow_mut().remove(&session_id);
    });
    
    ic_cdk::println!("Successfully deleted session: {}", session_id);
    Ok(format!("Session {} deleted successfully", session_id))
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

// Enhanced AI Functions
#[ic_cdk::update]
async fn validate_ai_topic(tutor_id: String, topic: String) -> Result<TopicValidation, String> {
    let caller = ic_cdk::caller();
    
    let tutor = TUTORS.with(|tutors| {
        tutors.borrow().iter()
            .find(|(_, t)| t.public_id == tutor_id && t.user_id == caller)
            .map(|(_, t)| t.clone())
    }).ok_or("Tutor not found or you don't have permission to access it")?;
    
    let validation = validate_topic(&tutor, &topic).await?;
    Ok(validation)
}

#[ic_cdk::update]
async fn generate_ai_course_outline(tutor_id: String, topic: String) -> Result<CourseOutline, String> {
    let caller = ic_cdk::caller();
    
    let tutor = TUTORS.with(|tutors| {
        tutors.borrow().iter()
            .find(|(_, t)| t.public_id == tutor_id && t.user_id == caller)
            .map(|(_, t)| t.clone())
    }).ok_or("Tutor not found or you don't have permission to access it")?;
    
    let user = get_self().ok_or("User not found")?;
    let outline = generate_course_outline(&tutor, &topic, &user.settings).await?;
    Ok(outline)
}

#[ic_cdk::update]
async fn send_ai_tutor_message(session_id: String, message: String) -> Result<(String, ComprehensionAnalysis), String> {
    let caller = ic_cdk::caller();
    
    // Get session
    let session = CHAT_SESSIONS.with(|sessions| {
        sessions.borrow().get(&session_id)
    }).ok_or("Session not found")?;
    
    if session.user_id != caller {
        return Err("You don't have permission to access this session".to_string());
    }
    
    // Get tutor
    let tutor = TUTORS.with(|tutors| {
        tutors.borrow().iter()
            .find(|(_, t)| t.public_id == session.tutor_id)
            .map(|(_, t)| t.clone())
    }).ok_or("Tutor not found")?;
    
    // Get user
    let user = get_self().ok_or("User not found")?;
    
    // Get session history
    let session_history = CHAT_MESSAGES.with(|messages| {
        messages.borrow().get(&session_id).map(|msg_list| msg_list.0).unwrap_or_default()
    });
    
    // Generate AI response
    let (response, analysis) = generate_tutor_chat_response(
        &session_id,
        &message,
        &session_history,
        &tutor,
        &user.settings,
    ).await?;
    
    // Save user message
    let user_message = ChatMessage {
        id: ic_cdk::api::time().to_string(),
        session_id: session_id.clone(),
        sender: "user".to_string(),
        content: message,
        timestamp: ic_cdk::api::time(),
        has_audio: Some(false),
    };
    
    // Save tutor response
    let tutor_message = ChatMessage {
        id: (ic_cdk::api::time() + 1).to_string(),
        session_id: session_id.clone(),
        sender: "tutor".to_string(),
        content: response.clone(),
        timestamp: ic_cdk::api::time(),
        has_audio: Some(false),
    };
    
    // Update session history
    let mut updated_history = session_history;
    updated_history.push(user_message);
    updated_history.push(tutor_message);
    
    CHAT_MESSAGES.with(|messages| {
        messages.borrow_mut().insert(session_id.clone(), ChatMessageList(updated_history));
    });
    
    // Update learning metrics
    let metrics_id = next_id("learning_metrics");
    let today = ic_cdk::api::time().to_string();
    let mut comprehension_scores = std::collections::HashMap::new();
    let mut difficulty_adjustments = std::collections::HashMap::new();
    
    comprehension_scores.insert(today.clone(), analysis.comprehension_score);
    difficulty_adjustments.insert(today.clone(), analysis.difficulty_adjustment.clone());
    
    let metrics = LearningMetrics {
        id: metrics_id,
        user_id: caller,
        session_id: session_id.parse::<u64>().unwrap_or(0),
        date: today,
        time_spent_minutes: 5, // Estimate
        messages_sent: 1,
        comprehension_scores,
        difficulty_adjustments,
        created_at: ic_cdk::api::time(),
        updated_at: ic_cdk::api::time(),
    };
    
    LEARNING_METRICS.with(|metrics_storage| {
        metrics_storage.borrow_mut().insert(metrics_id, metrics);
    });
    
    Ok((response, analysis))
}

#[ic_cdk::update]
async fn create_ai_learning_session(tutor_id: String, topic: String) -> Result<(String, String), String> {
    let caller = ic_cdk::caller();
    
    // Get tutor
    let tutor = TUTORS.with(|tutors| {
        tutors.borrow().iter()
            .find(|(_, t)| t.public_id == tutor_id && t.user_id == caller)
            .map(|(_, t)| t.clone())
    }).ok_or("Tutor not found or you don't have permission to access it")?;
    
    // Get user
    let user = get_self().ok_or("User not found")?;
    
    // Generate course outline
    let course_outline = generate_course_outline(&tutor, &topic, &user.settings).await?;
    
    // Create session
    let session_id = format!("session_{}", ic_cdk::api::time());
    let session = ChatSession {
        id: session_id.clone(),
        tutor_id: tutor_id.clone(),
        user_id: caller,
        topic: topic.clone(),
        status: "active".to_string(),
        created_at: ic_cdk::api::time(),
        updated_at: ic_cdk::api::time(),
    };
    
    CHAT_SESSIONS.with(|sessions| {
        sessions.borrow_mut().insert(session_id.clone(), session);
    });
    
    // Generate welcome message
    let welcome_message = generate_welcome_message(&tutor, &topic, Some(&course_outline)).await?;
    
    // Save welcome message
    let welcome_msg = ChatMessage {
        id: ic_cdk::api::time().to_string(),
        session_id: session_id.clone(),
        sender: "tutor".to_string(),
        content: welcome_message.clone(),
        timestamp: ic_cdk::api::time(),
        has_audio: Some(false),
    };
    
    CHAT_MESSAGES.with(|messages| {
        messages.borrow_mut().insert(session_id.clone(), ChatMessageList(vec![welcome_msg]));
    });
    
    // Create learning progress
    let progress_id = next_id("learning_progress");
    let progress = LearningProgress {
        id: progress_id,
        user_id: caller,
        session_id: session_id.parse::<u64>().unwrap_or(0),
        course_id: 1, // Placeholder
        progress_percentage: 0.0,
        current_module_id: None,
        current_subtopic: None,
        last_activity: ic_cdk::api::time(),
        created_at: ic_cdk::api::time(),
        updated_at: ic_cdk::api::time(),
    };
    
    LEARNING_PROGRESS.with(|progress_storage| {
        progress_storage.borrow_mut().insert(progress_id, progress);
    });
    
    Ok((session_id, welcome_message))
}

#[ic_cdk::query]
fn get_learning_progress(session_id: String) -> Result<LearningProgress, String> {
    let caller = ic_cdk::caller();
    
    LEARNING_PROGRESS.with(|progress_storage| {
        progress_storage.borrow().values()
            .find(|p| p.session_id == session_id.parse::<u64>().unwrap_or(0) && p.user_id == caller)
            .map(|p| p.clone())
            .ok_or("Learning progress not found".to_string())
    })
}

#[ic_cdk::query]
fn get_learning_metrics(session_id: String) -> Result<Vec<LearningMetrics>, String> {
    let caller = ic_cdk::caller();
    
    let metrics: Vec<LearningMetrics> = LEARNING_METRICS.with(|metrics_storage| {
        metrics_storage.borrow().values()
            .filter(|m| m.session_id == session_id.parse::<u64>().unwrap_or(0) && m.user_id == caller)
            .map(|m| m.clone())
            .collect()
    });
    
    Ok(metrics)
}

#[ic_cdk::update]
async fn complete_module(module_id: u64) -> Result<String, String> {
    let caller = ic_cdk::caller();
    
    // Create or update module completion
    let completion_id = next_id("module_completion");
    let completion = ModuleCompletion {
        id: completion_id,
        user_id: caller,
        module_id,
        completed: true,
        completion_date: Some(ic_cdk::api::time()),
        created_at: ic_cdk::api::time(),
        updated_at: ic_cdk::api::time(),
    };
    
    MODULE_COMPLETIONS.with(|completions| {
        completions.borrow_mut().insert(completion_id, completion);
    });
    
    Ok("Module marked as completed".to_string())
}

#[ic_cdk::query]
fn get_module_completions(session_id: String) -> Result<Vec<ModuleCompletion>, String> {
    let caller = ic_cdk::caller();
    
    let completions: Vec<ModuleCompletion> = MODULE_COMPLETIONS.with(|completions| {
        completions.borrow().values()
            .filter(|c| c.user_id == caller)
            .map(|c| c.clone())
            .collect()
    });
    
    Ok(completions)
}

// --- Candid Generation ---
ic_cdk::export_candid!();
