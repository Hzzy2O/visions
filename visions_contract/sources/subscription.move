/*
    Subscription Module
    
    Manages user subscriptions to creators with Seal framework integration for
    subscription-based access to encrypted content.
*/

module visions_contract::subscription {
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    
    use visions_contract::creator::{Creator};
    
    // Error constants
    const ENotAuthorized: u64 = 1;
    const EInsufficientPayment: u64 = 3;
    const ESubscriptionNotFound: u64 = 4;
    const ENoAccess: u64 = 7;
    
    // Subscription object representing a user's subscription to a creator
    public struct Subscription has key, store {
        id: UID,
        subscriber_addr: address,
        creator_addr: address,
        service_id: ID,
        start_time: u64,
        end_time: u64,
        active: bool,
    }
    
    // Service object representing a creator's subscription service
    public struct Service has key {
        id: UID,
        fee: u64,
        ttl: u64,
        owner: address,
        creator_id: ID,
    }
    
    // Administrative capability for service management
    public struct Cap has key {
        id: UID,
        service_id: ID,
    }
    
    // Event emitted when a new subscription is created
    public struct SubscriptionCreatedEvent has copy, drop {
        subscription_id: ID,
        subscriber_addr: address,
        creator_addr: address,
        start_time: u64,
        end_time: u64,
        payment_amount: u64,
    }
    
    // Event emitted when a new service is created
    public struct ServiceCreatedEvent has copy, drop {
        service_id: ID,
        creator_id: ID,
        fee: u64,
        ttl: u64,
        owner: address,
    }
    
    // Event emitted when a subscription is renewed
    public struct SubscriptionRenewedEvent has copy, drop {
        subscription_id: ID,
        new_end_time: u64,
        payment_amount: u64,
    }
    
    // Create a subscription service
    public fun create_service(
        creator: &Creator, 
        fee: u64, 
        ttl: u64, 
        ctx: &mut TxContext
    ): (Cap, ID) {
        // Create the service with the creator ID
        let service = Service {
            id: object::new(ctx),
            fee,
            ttl,
            owner: tx_context::sender(ctx),
            creator_id: object::id(creator),
        };
        let service_id = object::id(&service);
        let cap = Cap {
            id: object::new(ctx),
            service_id: service_id,
        };
        transfer::share_object(service);
        // emit event
        event::emit(ServiceCreatedEvent {
            service_id: service_id,
            creator_id: object::id(creator),
            fee,
            ttl,
            owner: tx_context::sender(ctx),
        });
        (cap, service_id)
    }

    public entry fun transfer_cap(cap: Cap, recipient: address) {
        transfer::transfer(cap, recipient);
    }
    
    
    // Subscribe to a creator's service
    public entry fun subscribe(
        user_addr: address,
        service: &Service,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(user_addr == tx_context::sender(ctx), ENotAuthorized);
        
        // Check payment amount
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= service.fee, EInsufficientPayment);
        
        // 直接转账整个 Coin，不再 split 和找零
        transfer::public_transfer(payment, service.owner);
        
        // Get current time
        let start_time = clock::timestamp_ms(clock);
        let end_time = start_time + service.ttl;
        
        // Create subscription object
        let subscription = Subscription {
            id: object::new(ctx),
            subscriber_addr: user_addr,
            creator_addr: service.owner,
            service_id: object::id(service),
            start_time,
            end_time,
            active: true,
        };
        
        // Emit subscription event
        event::emit(SubscriptionCreatedEvent {
            subscription_id: object::id(&subscription),
            subscriber_addr: user_addr,
            creator_addr: service.owner,
            start_time,
            end_time,
            payment_amount: service.fee,
        });
        
        // Transfer ownership of subscription to the user
        transfer::transfer(subscription, tx_context::sender(ctx));
    }
    
    // Renew an existing subscription
    public entry fun renew_subscription(
        subscription: &mut Subscription,
        service: &Service,
        user_addr: address,
        payment: &mut Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(user_addr == tx_context::sender(ctx), ENotAuthorized);
        assert!(user_addr == subscription.subscriber_addr, ENotAuthorized);
        
        // Validate service matches
        assert!(object::id(service) == subscription.service_id, ESubscriptionNotFound);
        
        // Check payment amount
        let payment_amount = coin::value(payment);
        assert!(payment_amount >= service.fee, EInsufficientPayment);
        
        // Split the coin for payment and return change
        let paid = coin::split(payment, service.fee, ctx);
        transfer::public_transfer(paid, service.owner);
        
        // Calculate new subscription end time
        let current_time = clock::timestamp_ms(clock);
        
        // If subscription expired, start from current time
        // Otherwise extend from current end time
        let new_end_time = if (subscription.end_time < current_time) {
            current_time + service.ttl
        } else {
            subscription.end_time + service.ttl
        };
        
        // Update subscription
        subscription.end_time = new_end_time;
        subscription.active = true;
        
        // Emit renewal event
        event::emit(SubscriptionRenewedEvent {
            subscription_id: object::id(subscription),
            new_end_time,
            payment_amount: service.fee,
        });
    }
    
    // Cancel a subscription (doesn't refund, just deactivates)
    public entry fun cancel_subscription(
        subscription: &mut Subscription,
        user_addr: address,
        ctx: &mut TxContext
    ) {
        assert!(user_addr == tx_context::sender(ctx), ENotAuthorized);
        assert!(user_addr == subscription.subscriber_addr, ENotAuthorized);
        
        // Set subscription as inactive
        subscription.active = false;
    }
    
    // Check if a subscription is active
    public fun is_active(
        subscription: &Subscription,
        clock: &Clock
    ): bool {
        let current_time = clock::timestamp_ms(clock);
        subscription.active && subscription.end_time > current_time
    }
    
    // Entry function for Seal framework to approve access
    public entry fun seal_approve(
        id: vector<u8>, 
        subscription: &Subscription, 
        service: &Service, 
        clock: &Clock
    ) {
        assert!(approve_internal(id, subscription, service, clock), ENoAccess);
    }
    
    // Seal framework access verification
    // Checks if a subscription is valid for accessing a particular content ID
    fun approve_internal(
        id: vector<u8>, 
        subscription: &Subscription, 
        service: &Service, 
        clock: &Clock
    ): bool {
        // Check if subscription is for the correct service
        if (object::id(service) != subscription.service_id) {
            return false
        };
        
        // Check if subscription is still valid (not expired)
        let current_time = clock::timestamp_ms(clock);
        if (current_time > subscription.end_time || !subscription.active) {
            return false
        };
        
        // Check if the content ID has the correct service prefix
        is_prefix(object::uid_to_bytes(&service.id), id)
    }
    
    // Utility function: check if a prefix is contained in a word
    fun is_prefix(prefix: vector<u8>, word: vector<u8>): bool {
        if (vector::length(&prefix) > vector::length(&word)) {
            return false
        };
        
        let mut i = 0;
        while (i < vector::length(&prefix)) {
            if (*vector::borrow(&prefix, i) != *vector::borrow(&word, i)) {
                return false
            };
            i = i + 1;
        };
        true
    }
    
    // Get subscription details
    public fun get_details(subscription: &Subscription): (address, address, ID, u64, u64, bool) {
        (
            subscription.subscriber_addr,
            subscription.creator_addr,
            subscription.service_id,
            subscription.start_time,
            subscription.end_time,
            subscription.active
        )
    }
    
    // Check if a user has an active subscription to a creator
    public fun has_active_subscription(
        user_addr: address,
        creator_addr: address,
        subscription: &Subscription,
        clock: &Clock
    ): bool {
        if (subscription.subscriber_addr == user_addr && 
            subscription.creator_addr == creator_addr) {
            return is_active(subscription, clock)
        };
        false
    }
    
    // Convenience entry function to create a service and transfer the Cap to the creator
    public entry fun create_service_entry(
        creator: &Creator,
        fee: u64, 
        ttl: u64, 
        ctx: &mut TxContext
    ) {
        let (cap, service_id) = create_service(creator, fee, ttl, ctx);
        transfer::transfer(cap, tx_context::sender(ctx));
        // emit event（重复 emit 不影响，方便前端直接监听 entry）
        event::emit(ServiceCreatedEvent {
            service_id: service_id,
            creator_id: object::id(creator),
            fee,
            ttl,
            owner: tx_context::sender(ctx),
        });
    }
} 
