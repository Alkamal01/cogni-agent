use crate::models::{
    user::User,
    tutor::{Tutor, TutorSession},
    learning_path::LearningPath,
    connections::{UserConnection, ConnectionRequest},
    study_group::{
        StudyGroup, GroupMembership,
        activity::{GroupActivity, StudyResource, GroupMessage},
        polls::{GroupPoll, PollVote},
        sessions::{StudySession, SessionParticipant},
    },
    billing::{SubscriptionPlan, UserSubscription, PaymentTransaction},
    gamification::{Achievement, UserAchievement, Task, UserTaskCompletion},
};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, StableCell};
use ic_stable_structures::storable::{Storable, Bound};
use std::borrow::Cow;
use std::cell::RefCell;
use candid::Principal;

type Memory = VirtualMemory<DefaultMemoryImpl>;

const USER_MEMORY_ID: MemoryId = MemoryId::new(0);
const TUTOR_MEMORY_ID: MemoryId = MemoryId::new(1);
const TUTOR_SESSION_MEMORY_ID: MemoryId = MemoryId::new(2);
const LEARNING_PATH_MEMORY_ID: MemoryId = MemoryId::new(3);
const CONNECTION_MEMORY_ID: MemoryId = MemoryId::new(4);
const CONNECTION_REQUEST_MEMORY_ID: MemoryId = MemoryId::new(5);
const STUDY_GROUP_MEMORY_ID: MemoryId = MemoryId::new(6);
const GROUP_MEMBERSHIP_MEMORY_ID: MemoryId = MemoryId::new(7);
const SUBSCRIPTION_PLAN_MEMORY_ID: MemoryId = MemoryId::new(8);
const USER_SUBSCRIPTION_MEMORY_ID: MemoryId = MemoryId::new(9);
const PAYMENT_TRANSACTION_MEMORY_ID: MemoryId = MemoryId::new(10);
const ACHIEVEMENT_MEMORY_ID: MemoryId = MemoryId::new(11);
const USER_ACHIEVEMENT_MEMORY_ID: MemoryId = MemoryId::new(12);
const TASK_MEMORY_ID: MemoryId = MemoryId::new(13);
const USER_TASK_COMPLETION_MEMORY_ID: MemoryId = MemoryId::new(14);
const MESSAGE_MEMORY_ID: MemoryId = MemoryId::new(15);


const ID_COUNTER_MEMORY_ID: MemoryId = MemoryId::new(20);


#[derive(serde::Serialize, serde::Deserialize, Default, Clone)]
struct IdCounters {
    user: u64,
    tutor: u64,
    tutor_session: u64,
    learning_path: u64,
    connection: u64,
    connection_request: u64,
    study_group: u64,
    group_membership: u64,
    subscription_plan: u64,
    user_subscription: u64,
    payment_transaction: u64,
    achievement: u64,
    user_achievement: u64,
    task: u64,
    user_task_completion: u64,
    message: u64,
}

impl Storable for IdCounters {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(serde_cbor::to_vec(&self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        serde_cbor::from_slice(bytes.as_ref()).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

thread_local! {
    // The memory manager is used for managing memory allocation for stable structures.
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    // The users map stores User structs, keyed by their Principal.
    pub static USERS: RefCell<StableBTreeMap<Principal, User, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USER_MEMORY_ID)),
        )
    );

    // Stable storage for Tutors
    pub static TUTORS: RefCell<StableBTreeMap<u64, Tutor, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(TUTOR_MEMORY_ID)),
        )
    );

    // Stable storage for Tutor Sessions
    pub static TUTOR_SESSIONS: RefCell<StableBTreeMap<u64, TutorSession, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(TUTOR_SESSION_MEMORY_ID)),
        )
    );

    // Stable storage for Learning Paths
    pub static LEARNING_PATHS: RefCell<StableBTreeMap<u64, LearningPath, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(LEARNING_PATH_MEMORY_ID)),
        )
    );

    // Stable storage for Connections
    pub static CONNECTIONS: RefCell<StableBTreeMap<u64, UserConnection, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(CONNECTION_MEMORY_ID)),
        )
    );

    // Stable storage for Connection Requests
    pub static CONNECTION_REQUESTS: RefCell<StableBTreeMap<u64, ConnectionRequest, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(CONNECTION_REQUEST_MEMORY_ID)),
        )
    );

    // Stable storage for Study Groups
    pub static STUDY_GROUPS: RefCell<StableBTreeMap<u64, StudyGroup, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(STUDY_GROUP_MEMORY_ID)),
        )
    );

    // Stable storage for Group Memberships
    pub static GROUP_MEMBERSHIPS: RefCell<StableBTreeMap<u64, GroupMembership, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(GROUP_MEMBERSHIP_MEMORY_ID)),
        )
    );

    // Stable storage for Billing
    pub static SUBSCRIPTION_PLANS: RefCell<StableBTreeMap<u64, SubscriptionPlan, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(SUBSCRIPTION_PLAN_MEMORY_ID)),
        )
    );

    pub static USER_SUBSCRIPTIONS: RefCell<StableBTreeMap<u64, UserSubscription, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USER_SUBSCRIPTION_MEMORY_ID)),
        )
    );

    pub static PAYMENT_TRANSACTIONS: RefCell<StableBTreeMap<u64, PaymentTransaction, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(PAYMENT_TRANSACTION_MEMORY_ID)),
        )
    );

    // Stable storage for Gamification
    pub static ACHIEVEMENTS: RefCell<StableBTreeMap<u64, Achievement, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(ACHIEVEMENT_MEMORY_ID)),
        )
    );

    pub static USER_ACHIEVEMENTS: RefCell<StableBTreeMap<u64, UserAchievement, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USER_ACHIEVEMENT_MEMORY_ID)),
        )
    );

    pub static TASKS: RefCell<StableBTreeMap<u64, Task, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(TASK_MEMORY_ID)),
        )
    );

    pub static USER_TASK_COMPLETIONS: RefCell<StableBTreeMap<u64, UserTaskCompletion, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USER_TASK_COMPLETION_MEMORY_ID)),
        )
    );

    // Stable cell for ID counters
    pub static ID_COUNTERS: RefCell<StableCell<IdCounters, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(ID_COUNTER_MEMORY_ID)),
            IdCounters::default()
        ).expect("failed to init id counters")
    );
}

// Helper function to increment and get the next ID for a given type
pub fn next_id(entity: &str) -> u64 {
    ID_COUNTERS.with(|counters| {
        let mut writer = counters.borrow_mut();
        let mut current_counters = writer.get().clone();
        match entity {
            "user" => {
                current_counters.user += 1;
                writer.set(current_counters).unwrap();
                writer.get().user
            }
            "tutor" => {
                current_counters.tutor += 1;
                writer.set(current_counters).unwrap();
                writer.get().tutor
            }
            "tutor_session" => {
                current_counters.tutor_session += 1;
                writer.set(current_counters).unwrap();
                writer.get().tutor_session
            }
            "learning_path" => {
                current_counters.learning_path += 1;
                writer.set(current_counters).unwrap();
                writer.get().learning_path
            }
            "connection" => {
                current_counters.connection += 1;
                writer.set(current_counters).unwrap();
                writer.get().connection
            }
            "connection_request" => {
                current_counters.connection_request += 1;
                writer.set(current_counters).unwrap();
                writer.get().connection_request
            }
            "study_group" => {
                current_counters.study_group += 1;
                writer.set(current_counters).unwrap();
                writer.get().study_group
            }
            "group_membership" => {
                current_counters.group_membership += 1;
                writer.set(current_counters).unwrap();
                writer.get().group_membership
            }
            "subscription_plan" => {
                current_counters.subscription_plan += 1;
                writer.set(current_counters).unwrap();
                writer.get().subscription_plan
            }
            "user_subscription" => {
                current_counters.user_subscription += 1;
                writer.set(current_counters).unwrap();
                writer.get().user_subscription
            }
            "payment_transaction" => {
                current_counters.payment_transaction += 1;
                writer.set(current_counters).unwrap();
                writer.get().payment_transaction
            }
            "achievement" => {
                current_counters.achievement += 1;
                writer.set(current_counters).unwrap();
                writer.get().achievement
            }
            "user_achievement" => {
                current_counters.user_achievement += 1;
                writer.set(current_counters).unwrap();
                writer.get().user_achievement
            }
            "task" => {
                current_counters.task += 1;
                writer.set(current_counters).unwrap();
                writer.get().task
            }
            "user_task_completion" => {
                current_counters.user_task_completion += 1;
                writer.set(current_counters).unwrap();
                writer.get().user_task_completion
            }
            "message" => {
                current_counters.message += 1;
                writer.set(current_counters).unwrap();
                writer.get().message
            }
            _ => panic!("Unknown entity type for ID generation"),
        }
    })
} 