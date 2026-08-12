
# LeadNexus

LeadNexus is a full-stack lead intelligence, recovery, attribution and business lead-management platform built with Next.js and Supabase.

## Overview

LeadNexus helps businesses:

- create professional public business pages
- publish products and services
- capture visitor contact details
- create tracked campaign and social links
- measure attribution and visitor behaviour
- identify product interest
- score lead intent
- classify leads as HOT, WARM or COLD
- manage direct-contact leads
- recover valuable abandoned leads
- track qualification and customer conversion
- configure public-page SEO
- prepare structured lead handoffs for external integrations

Customers do not require a LeadNexus account.

## User Types

### Platform Admin

Platform administrators can review:

- businesses
- all platform leads
- lead intelligence
- abandoned high-intent leads
- recovery candidates
- recovery decisions
- platform-level performance

Admin-only leads are not exposed to business owners until explicitly released through the recovery workflow.

### Business Owner

Business owners can:

- complete onboarding
- manage business information
- manage products and services
- configure business hours
- configure social/contact channels
- manage public-page settings
- create tracking links
- view owner-visible leads
- update lead statuses
- add lead notes
- view recovered leads
- view analytics
- manage SEO
- queue structured integration handoffs

### Customer / Lead

Customers do not create accounts.

They can:

- visit public business pages
- browse products and services
- submit contact details
- select products of interest
- use WhatsApp, email, phone or social contact options

## Lead Visibility

LeadNexus intentionally separates visitor capture from owner visibility.

```text
Lead form submitted
        |
        v
    ADMIN_ONLY
        |
        +-------------------------+
        |                         |
Direct contact action        No direct contact
        |                         |
        v                         v
 OWNER_VISIBLE             Lead Intelligence
 DIRECT_CONTACT                   |
                                  v
                           Admin Recovery Queue
                                  |
                          +-------+-------+
                          |               |
                        Ignore           Send
                                          |
                                          v
                                  OWNER_VISIBLE
                                     RECOVERED