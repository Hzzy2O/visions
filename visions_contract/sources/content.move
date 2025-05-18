/*
    Content Module
    
    Manages content metadata for creators, including integration with Walrus storage.
*/

module visions_contract::content {
    use sui::event;
    
    use std::string::{Self, String};
    use visions_contract::creator::{Self, Creator};
    use visions_contract::subscription::{Self, Subscription};
    use sui::clock::{Clock};
    
    // Error constants
    const ENotAuthorized: u64 = 1;
    const EInvalidTitle: u64 = 2;
    const EInvalidContentType: u64 = 3;
    const EInvalidWalrusReference: u64 = 4;
    
    // Content types
    const CONTENT_TYPE_IMAGE: vector<u8> = b"image";
    const CONTENT_TYPE_VIDEO: vector<u8> = b"video";
    const CONTENT_TYPE_DOCUMENT: vector<u8> = b"document";
    const CONTENT_TYPE_AUDIO: vector<u8> = b"audio";
    
    // Content object representing creator's premium content
    public struct Content has key, store {
        id: UID,
        creator_addr: address,
        creator_id: ID,
        title: String,
        description: Option<String>,
        walrus_reference: String, // Reference to encrypted content in Walrus
        preview_reference: String, // 新增字段
        created_at: u64,
        content_type: String,     // Type of content (image, video, etc.)
    }
    
    // Event emitted when content is created
    public struct ContentCreatedEvent has copy, drop {
        content_id: ID,
        creator_id: ID,
        title: String,
        content_type: String,
    }
    
    // Create premium content
    public entry fun create_premium_content(
        creator: &mut Creator,
        user_addr: address,
        title: vector<u8>,
        description: vector<u8>,
        walrus_reference: vector<u8>,
        preview_reference: vector<u8>,
        content_type: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Verify caller is the creator
        assert!(user_addr == tx_context::sender(ctx), ENotAuthorized);
        assert!(user_addr == creator::get_user_addr(creator), ENotAuthorized);
        
        // Validate inputs
        assert!(std::vector::length(&title) > 0, EInvalidTitle);
        assert!(std::vector::length(&walrus_reference) > 0, EInvalidWalrusReference);
        assert!(std::vector::length(&preview_reference) > 0, EInvalidWalrusReference);
        assert!(
            std::vector::length(&content_type) > 0 && 
            is_valid_content_type(content_type),
            EInvalidContentType
        );
        
        // Create content object
        let content = Content {
            id: object::new(ctx),
            creator_addr: creator::get_user_addr(creator),
            creator_id: object::id(creator),
            title: string::utf8(title),
            description: if (std::vector::length(&description) > 0) {
                option::some(string::utf8(description))
            } else {
                option::none()
            },
            walrus_reference: string::utf8(walrus_reference),
            preview_reference: string::utf8(preview_reference), // 新增
            created_at: tx_context::epoch(ctx),
            content_type: string::utf8(content_type),
        };
        
        // Emit content creation event
        event::emit(ContentCreatedEvent {
            content_id: object::id(&content),
            creator_id: object::id(creator),
            title: content.title,
            content_type: content.content_type,
        });
        
        // Increment creator's content count
        creator::increment_content_count(creator);
        
        // Transfer content to the creator
        transfer::transfer(content, tx_context::sender(ctx));
    }
    
    // Update content metadata
    public entry fun update_content_metadata(
        content: &mut Content,
        user_addr: address,
        creator: &Creator,
        new_title: vector<u8>,
        new_description: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Verify caller is the creator
        assert!(user_addr == tx_context::sender(ctx), ENotAuthorized);
        assert!(user_addr == creator::get_user_addr(creator), ENotAuthorized);
        assert!(creator::get_user_addr(creator) == content.creator_addr, ENotAuthorized);
        
        // Update title if provided
        if (std::vector::length(&new_title) > 0) {
            content.title = string::utf8(new_title);
        };
        
        // Update description
        content.description = if (std::vector::length(&new_description) > 0) {
            option::some(string::utf8(new_description))
        } else {
            option::none()
        };
    }
    
    // Get content metadata
    public fun get_content_metadata(content: &Content): (String, Option<String>, String, String) {
        (
            content.title,
            content.description,
            content.walrus_reference,
            content.content_type
        )
    }
    
    // Get content creator ID
    public fun get_creator_id(content: &Content): ID {
        content.creator_id
    }
    
    // Get content walrus reference
    public fun get_walrus_reference(content: &Content): String {
        content.walrus_reference
    }
    
    // Validate content type
    fun is_valid_content_type(content_type: vector<u8>): bool {
        content_type == CONTENT_TYPE_IMAGE ||
        content_type == CONTENT_TYPE_VIDEO ||
        content_type == CONTENT_TYPE_DOCUMENT ||
        content_type == CONTENT_TYPE_AUDIO
    }
    
    public fun check_content_access(
        content: &Content,
        user_addr: address,
        subscription: &Subscription,
        clock: &Clock
    ): bool {
        subscription::has_active_subscription(
            user_addr,
            content.creator_addr,
            subscription,
            clock
        )
    }
} 
