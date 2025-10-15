#!/bin/bash

# COD CRM - Push to GitHub Script
# Run this script after creating the repository on GitHub

echo "🚀 COD CRM - Push to GitHub"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo "❌ Error: Please run this script from the cod-crm directory"
    exit 1
fi

# Get GitHub username
echo "Enter your GitHub username:"
read GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ Error: GitHub username is required"
    exit 1
fi

echo ""
echo "📋 Setting up remote repository..."
git remote add origin https://github.com/$GITHUB_USERNAME/cod-crm.git

echo "📋 Setting main branch..."
git branch -M main

echo "📋 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Success! Your COD CRM project is now on GitHub!"
echo "🌐 Repository URL: https://github.com/$GITHUB_USERNAME/cod-crm"
echo ""
echo "🎉 Next steps:"
echo "1. Visit your repository on GitHub"
echo "2. Share the repository URL with others"
echo "3. Continue developing and push updates with: git push"
echo ""
