# Visions - Blockchain Creator Platform

Visions is a creator platform built on the Sui blockchain that allows creators to share premium content and earn through subscription models. The project includes smart contracts and a Next.js frontend application.

## Project Overview

The Visions platform enables:
- Creators to register and create profiles
- Creators to upload various content types (images, videos, documents, audio)
- Users to subscribe to creators to access premium content
- Blockchain-based subscription management and payment systems

## Tech Stack

### Frontend
- Next.js
- React
- TanStack Query (React Query)
- Framer Motion (animations)
- @mysten/dapp-kit (Sui wallet integration)

### Smart Contracts
- Sui Move language
- Sui Framework

## Smart Contract Structure

Contracts are located in the `visions_contract` directory and include the following core modules:

### 1. Creator Module (creator.move)
- Manages creator profiles
- Allows users to become creators
- Stores creator names, descriptions, and content counts

### 2. Content Module (content.move)
- Manages creator content metadata
- Supports multiple content types (images, videos, documents, audio)
- Integrates encrypted storage to protect premium content

### 3. Subscription Module (subscription.move)
- Manages user subscriptions
- Handles payments and access control
- Processes subscription fees through Sui payments

## Frontend Features

### Home Page (`app/page.tsx`)
- Showcases creator content
- Filters and sorts content by different criteria
- Attracts new creators to the platform

### Creator Setup (`app/creator/setup/`)
- Creator registration flow
- Creation and management of creator profiles

### Content Management (`app/content/`)
- Upload and manage content
- Set content access permissions

### Wallet Integration (`app/providers.tsx`)
- Sui wallet connection
- Transaction notifications

## Deployment

### Smart Contract Deployment

1. Navigate to the contract directory:
```bash
cd visions_contract
```

2. Build the contract:
```bash
sui move build
```

3. Deploy to Sui testnet:
```bash
sui client publish --gas-budget 100000000
```

4. Update contract addresses in `app/contracts.ts`

### Frontend Application Deployment

1. Install dependencies:
```bash
npm install
```

2. Run in development mode:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
npm start
```

## Usage Flow

### For Creators
1. Connect Sui wallet
2. Register as a creator via the "Become Creator" button
3. Set up creator profile
4. Create subscription service and set pricing
5. Upload content and set as premium

### For Users
1. Connect Sui wallet
2. Browse available creators and content
3. Subscribe to creators of interest
4. Access subscribed premium content

## Development Roadmap

- [ ] Implement content recommendation algorithms
- [ ] Add social features (comments, likes)
- [ ] Support NFT content publishing
- [ ] Multi-tier subscription models
- [ ] Support for more content types

## Contributing

Contributions via Pull Requests or Issues are welcome.

## License

[MIT](LICENSE)

[中文文档](readme.zh.md)
