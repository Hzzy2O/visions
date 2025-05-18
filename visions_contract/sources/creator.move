/*
    Creator Module
    
    Manages content creators and their profiles on the Visions platform.
*/

module visions_contract::creator {
    use sui::event;
    use std::string::{Self, String};
    
    // Error constants
    const ENotAuthorized: u64 = 1;
    const EInvalidName: u64 = 2;
    
    // Creator object representing a content creator
    public struct Creator has key, store {
        id: UID,
        user_addr: address,
        name: String,
        description: Option<String>,
        content_count: u64,
        created_at: u64,
    }
    
    // Event emitted when a new creator is created
    public struct CreatorCreatedEvent has copy, drop {
        creator_id: ID,
        user_addr: address,
        name: String,
    }
    
    // Update creator description
    public entry fun update_description(
        creator: &mut Creator,
        user_addr: address,
        new_description: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Verify caller is the creator
        assert!(user_addr == tx_context::sender(ctx), ENotAuthorized);
        assert!(user_addr == creator.user_addr, ENotAuthorized);
        
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
    
    // Get creator user address
    public fun get_user_addr(creator: &Creator): address {
        creator.user_addr
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
    
    // Become a creator and create a service
    public entry fun become_creator(
        user_addr: address,
        name: vector<u8>,
        description: vector<u8>,
        ctx: &mut TxContext
    ): ID {
        assert!(user_addr == tx_context::sender(ctx), ENotAuthorized);
        assert!(std::vector::length(&name) > 0, EInvalidName);

        let creator = Creator {
            id: object::new(ctx),
            user_addr,
            name: string::utf8(name),
            description: if (std::vector::length(&description) > 0) {
                option::some(string::utf8(description))
            } else {
                option::none()
            },
            content_count: 0,
            created_at: tx_context::epoch(ctx),
        };

        event::emit(CreatorCreatedEvent {
            creator_id: object::id(&creator),
            user_addr,
            name: creator.name,
        });

        let creator_id = object::id(&creator);
        transfer::transfer(creator, user_addr);
        creator_id
    }
} 
