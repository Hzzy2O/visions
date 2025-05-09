/*
    Creator Module
    
    Manages content creators and their profiles on the Visions platform.
*/

module visions_contract::creator {
    use sui::event;
    use std::string::{Self, String};
    
    use visions_contract::user::{Self, User};
    
    // Error constants
    const ENotAuthorized: u64 = 1;
    const EInvalidName: u64 = 2;
    const EInvalidPrice: u64 = 3;
    
    // Creator object representing a content creator
    public struct Creator has key, store {
        id: UID,
        user_id: ID,
        name: String,
        description: Option<String>,
        subscription_price: u64, // In SUI (smallest unit)
        content_count: u64,
        created_at: u64,
    }
    
    // Event emitted when a new creator is created
    public struct CreatorCreatedEvent has copy, drop {
        creator_id: ID,
        user_id: ID,
        name: String,
    }
    
    // Event emitted when subscription price is updated
    public struct SubscriptionPriceUpdatedEvent has copy, drop {
        creator_id: ID,
        old_price: u64,
        new_price: u64,
    }
    
    // Become a creator - user must exist already
    public entry fun become_creator(
        user: &User,
        name: vector<u8>,
        description: vector<u8>,
        subscription_price: u64,
        ctx: &mut TxContext
    ) {
        // Verify caller is the user
        assert!(user::is_owner(user, tx_context::sender(ctx)), ENotAuthorized);
        
        // Validate inputs
        assert!(std::vector::length(&name) > 0, EInvalidName);
        assert!(subscription_price > 0, EInvalidPrice);
        
        // Create creator object
        let creator = Creator {
            id: object::new(ctx),
            user_id: object::id(user),
            name: string::utf8(name),
            description: if (std::vector::length(&description) > 0) {
                option::some(string::utf8(description))
            } else {
                option::none()
            },
            subscription_price,
            content_count: 0,
            created_at: tx_context::epoch(ctx),
        };
        
        // Emit creator creation event
        event::emit(CreatorCreatedEvent {
            creator_id: object::id(&creator),
            user_id: object::id(user),
            name: creator.name,
        });
        
        // Transfer the creator object to the user
        transfer::transfer(creator, tx_context::sender(ctx));
    }
    
    // Update subscription price
    public entry fun update_subscription_price(
        creator: &mut Creator,
        user: &User,
        new_price: u64,
        ctx: &mut TxContext
    ) {
        // Verify caller is the creator
        assert!(user::is_owner(user, tx_context::sender(ctx)), ENotAuthorized);
        assert!(object::id(user) == creator.user_id, ENotAuthorized);
        
        // Validate new price
        assert!(new_price > 0, EInvalidPrice);
        
        // Emit price update event
        event::emit(SubscriptionPriceUpdatedEvent {
            creator_id: object::id(creator),
            old_price: creator.subscription_price,
            new_price,
        });
        
        // Update the price
        creator.subscription_price = new_price;
    }
    
    // Update creator description
    public entry fun update_description(
        creator: &mut Creator,
        user: &User,
        new_description: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Verify caller is the creator
        assert!(user::is_owner(user, tx_context::sender(ctx)), ENotAuthorized);
        assert!(object::id(user) == creator.user_id, ENotAuthorized);
        
        // Update the description
        creator.description = if (std::vector::length(&new_description) > 0) {
            option::some(string::utf8(new_description))
        } else {
            option::none()
        };
    }
    
    // Increment content count (called when creator adds content)
    public fun increment_content_count(creator: &mut Creator) {
        creator.content_count = creator.content_count + 1;
    }
    
    // Get subscription price
    public fun get_subscription_price(creator: &Creator): u64 {
        creator.subscription_price
    }
    
    // Get creator user ID
    public fun get_user_id(creator: &Creator): ID {
        creator.user_id
    }
    
    // Get creator name
    public fun get_name(creator: &Creator): String {
        creator.name
    }
    
    // Get creator description
    public fun get_description(creator: &Creator): Option<String> {
        creator.description
    }
    
    // Get content count
    public fun get_content_count(creator: &Creator): u64 {
        creator.content_count
    }
} 
