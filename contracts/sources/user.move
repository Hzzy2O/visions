/*
    User Module
    
    Handles user registration and profile management for the Visions platform.
*/

module visions_contract::user {
    use sui::event;
    use std::string::{Self, String};
    use sui::table::{Self, Table};
    
    // Error constants
    const EUserAlreadyExists: u64 = 1;
    const EInvalidUsername: u64 = 2;
    const ENotAuthorized: u64 = 3;
    
    // User object representing a platform user
    public struct User has key, store {
        id: UID,
        address: address,
        username: Option<String>,
        created_at: u64,
    }
    
    // UserRegistry to keep track of registered users
    public struct UserRegistry has key {
        id: UID,
        users: Table<address, bool>
    }
    
    // Event emitted when a new user is created
    public struct UserCreatedEvent has copy, drop {
        user_id: ID,
        address: address,
        username: Option<String>,
    }
    
    // Initialize the user registry - called once by the package publisher
    fun init(ctx: &mut TxContext) {
        let registry = UserRegistry {
            id: object::new(ctx),
            users: table::new(ctx)
        };
        
        // Share the registry as a shared object
        transfer::share_object(registry);
    }
    
    // Create a new user
    public entry fun create_user(
        registry: &mut UserRegistry,
        username: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Verify that the user doesn't already exist
        assert!(!table::contains(&registry.users, sender), EUserAlreadyExists);
        
        // Create the user object
        let user = User {
            id: object::new(ctx),
            address: sender,
            username: if (std::vector::length(&username) > 0) {
                option::some(string::utf8(username))
            } else {
                option::none()
            },
            created_at: tx_context::epoch(ctx),
        };
        
        // Register the user in the registry
        table::add(&mut registry.users, sender, true);
        
        // Emit user creation event
        event::emit(UserCreatedEvent {
            user_id: object::id(&user),
            address: sender,
            username: user.username,
        });
        
        // Transfer the user object to the sender
        transfer::transfer(user, sender);
    }
    
    // Update user's username
    public entry fun update_username(
        user: &mut User,
        new_username: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Only the owner can update the username
        assert!(tx_context::sender(ctx) == user.address, ENotAuthorized);
        
        // Validate username length
        assert!(std::vector::length(&new_username) > 0, EInvalidUsername);
        
        // Update the username
        user.username = option::some(string::utf8(new_username));
    }
    
    // Check if a user owns this User object
    public fun is_owner(user: &User, addr: address): bool {
        user.address == addr
    }
    
    // Get user address
    public fun get_address(user: &User): address {
        user.address
    }
    
    // Get user creation time
    public fun get_created_at(user: &User): u64 {
        user.created_at
    }
    
    // Get user username if set
    public fun get_username(user: &User): Option<String> {
        user.username
    }
    
    // Check if an address is registered as a user
    public fun is_registered(registry: &UserRegistry, addr: address): bool {
        table::contains(&registry.users, addr)
    }
} 
