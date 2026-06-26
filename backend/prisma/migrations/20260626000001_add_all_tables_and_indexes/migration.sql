-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "organization_type" AS ENUM ('strukturvertrieb', 'broker', 'partner', 'sonstiges');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'management', 'broker', 'backoffice', 'finance', 'support', 'compliance');

-- CreateEnum
CREATE TYPE "advisor_role" AS ENUM ('advisor', 'team_lead', 'address_broker');

-- CreateEnum
CREATE TYPE "swiss_canton" AS ENUM ('AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH');

-- CreateEnum
CREATE TYPE "civil_status" AS ENUM ('single', 'married', 'divorced', 'widowed', 'registered_partnership', 'dissolved_partnership');

-- CreateEnum
CREATE TYPE "customer_type" AS ENUM ('private', 'business');

-- CreateEnum
CREATE TYPE "customer_status" AS ENUM ('active', 'inactive', 'prospect');

-- CreateEnum
CREATE TYPE "mandate_status" AS ENUM ('valid', 'invalid', 'pending', 'expired');

-- CreateEnum
CREATE TYPE "insurance_type" AS ENUM ('life', 'health', 'property', 'liability', 'motor', 'other');

-- CreateEnum
CREATE TYPE "contract_status" AS ENUM ('active', 'pending', 'cancelled', 'expired', 'archived');

-- CreateEnum
CREATE TYPE "process_status" AS ENUM ('neu', 'pruefung_offen', 'kunde_kontaktieren', 'verlaengerung_vorbereiten', 'beratung_erfolgt', 'erledigt');

-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('new', 'in_progress', 'waiting', 'approved', 'rejected', 'archived');

-- CreateEnum
CREATE TYPE "commission_type" AS ENUM ('einmalig', 'wiederkehrend');

-- CreateEnum
CREATE TYPE "commission_status" AS ENUM ('offen', 'bezahlt', 'storniert');

-- CreateEnum
CREATE TYPE "commission_entry_status" AS ENUM ('pending', 'invoiced', 'received', 'earned', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "document_category" AS ENUM ('contract', 'application', 'identification', 'correspondence', 'other');

-- CreateEnum
CREATE TYPE "document_processing_stage" AS ENUM ('uploaded', 'parsed', 'entities_detected', 'customer_mapped', 'application_created', 'policy_created');

-- CreateEnum
CREATE TYPE "document_doc_type" AS ENUM ('antrag', 'anlage', 'unbekannt');

-- CreateEnum
CREATE TYPE "document_classification_status" AS ENUM ('ausstehend', 'klassifiziert', 'pruefung_erforderlich', 'manuell');

-- CreateEnum
CREATE TYPE "access_level" AS ENUM ('public_admin_only', 'assigned_advisors_only', 'assigned_brokers_only', 'team_visible', 'all_internal');

-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('open', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "task_priority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "task_type" AS ENUM ('onboarding', 'renewal', 'follow_up', 'consultation', 'general', 'health_declaration');

-- CreateEnum
CREATE TYPE "lead_source" AS ENUM ('website', 'referral', 'campaign', 'manual', 'import');

-- CreateEnum
CREATE TYPE "lead_status" AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');

-- CreateEnum
CREATE TYPE "lead_autopilot_status" AS ENUM ('off', 'active', 'paused');

-- CreateEnum
CREATE TYPE "lead_offer_status" AS ENUM ('none', 'preparing', 'ready', 'sent', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('contract_expiry', 'application_update', 'missing_document', 'task_reminder');

-- CreateEnum
CREATE TYPE "notification_status" AS ENUM ('sent', 'failed');

-- CreateEnum
CREATE TYPE "message_direction" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "message_channel" AS ENUM ('email', 'sms', 'portal', 'phone');

-- CreateEnum
CREATE TYPE "message_status" AS ENUM ('sent', 'delivered', 'read', 'failed');

-- CreateEnum
CREATE TYPE "message_reference_type" AS ENUM ('contract', 'interaction', 'general');

-- CreateEnum
CREATE TYPE "status_definition_type" AS ENUM ('application', 'contract');

-- CreateEnum
CREATE TYPE "status_color" AS ENUM ('gray', 'blue', 'yellow', 'orange', 'green', 'red', 'purple', 'teal');

-- CreateEnum
CREATE TYPE "status_category" AS ENUM ('offen', 'positiv', 'negativ', 'abgeschlossen');

-- CreateEnum
CREATE TYPE "status_history_entity_type" AS ENUM ('application', 'contract');

-- CreateEnum
CREATE TYPE "bag_modell" AS ENUM ('standard', 'telmed', 'hausarzt', 'hmo', 'other');

-- CreateEnum
CREATE TYPE "bag_altersklasse" AS ENUM ('kind', 'jugend', 'erwachsen');

-- CreateEnum
CREATE TYPE "bag_geschlecht" AS ENUM ('m', 'w');

-- CreateEnum
CREATE TYPE "krankenkassen_vergleich_status" AS ENUM ('entwurf', 'durchgefuehrt', 'gespeichert', 'praesentiert');

-- CreateEnum
CREATE TYPE "comparison_group" AS ENUM ('aktuelle_loesung', 'optimiert', 'angebot_1', 'angebot_2', 'angebot_3', 'angebot_4', 'angebot_5', 'manuell');

-- CreateEnum
CREATE TYPE "comparison_section" AS ENUM ('grundversicherung', 'zusatzversicherung');

-- CreateEnum
CREATE TYPE "vergleichs_analyse_status" AS ENUM ('analyse_laeuft', 'beratung_erfolgt', 'umgesetzt', 'abgelehnt', 'ueberpruefung');

-- CreateEnum
CREATE TYPE "accounting_entry_type" AS ENUM ('commission', 'payout', 'storno', 'adjustment');

-- CreateEnum
CREATE TYPE "accounting_entry_status" AS ENUM ('pending', 'booked', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "accounting_reference_type" AS ENUM ('commission_entry', 'commission_split', 'payout', 'storno');

-- CreateEnum
CREATE TYPE "payout_status" AS ENUM ('draft', 'approved', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "finance_period_status" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "ausschreibung_status" AS ENUM ('entwurf', 'vorbereitung', 'versendet', 'offenen_ausstehend', 'teilweise_erhalten', 'vollstaendig_erhalten', 'in_analyse', 'praesentation_erstellt', 'praesentiert', 'entscheidung_ausstehend', 'gewonnen', 'verloren', 'abgeschlossen');

-- CreateEnum
CREATE TYPE "ausschreibung_prioritaet" AS ENUM ('niedrig', 'mittel', 'hoch', 'dringend');

-- CreateEnum
CREATE TYPE "ausschreibung_bereich" AS ENUM ('privat', 'gewerbe', 'industrie', 'landwirtschaft');

-- CreateEnum
CREATE TYPE "offerte_status" AS ENUM ('ausstehend', 'erhalten', 'analysiert', 'empfohlen', 'abgelehnt', 'angenommen');

-- CreateEnum
CREATE TYPE "partner_category" AS ENUM ('versicherung', 'bank', 'finanzierungspartner', 'vorsorgepartner', 'rechtsschutz', 'krankenkasse', 'sonstige');

-- CreateEnum
CREATE TYPE "partner_status" AS ENUM ('aktiv', 'inaktiv');

-- CreateEnum
CREATE TYPE "partner_activity_type" AS ENUM ('document_uploaded', 'document_deleted', 'document_modified', 'partner_created', 'partner_updated');

-- CreateEnum
CREATE TYPE "partner_document_category" AS ENUM ('vertragsdokumente', 'courtagevereinbarungen', 'provisionsabrechnungen', 'zielvereinbarungen', 'deals_spezialvereinbarungen', 'korrespondenz', 'schulungsunterlagen', 'verkaufsfoerderung', 'sonstige');

-- CreateEnum
CREATE TYPE "claim_status" AS ENUM ('eingereicht', 'in_pruefung', 'genehmigt', 'abgelehnt', 'ausbezahlt');

-- CreateEnum
CREATE TYPE "deal_stage" AS ENUM ('erstkontakt', 'bedarfsanalyse', 'angebot_versendet', 'verhandlung', 'abschluss', 'verloren');

-- CreateEnum
CREATE TYPE "deal_insurance_type" AS ENUM ('KVG', 'VVG', 'Leben', 'Haftpflicht', 'Hausrat', 'Rechtsschutz', 'Motorfahrzeug', 'Gebaeude', 'Unfall', 'Krankentaggeld', 'BVG', 'Saeule_3a', 'Sonstige');

-- CreateEnum
CREATE TYPE "deal_source" AS ENUM ('empfehlung', 'website', 'kaltakquise', 'event', 'marketing', 'sonstiges');

-- CreateEnum
CREATE TYPE "verkaufschance_status" AS ENUM ('neu', 'in_ausschreibung', 'offerten_erhalten', 'beratung_erfolgt', 'kunde_entscheidet', 'gewonnen', 'verloren', 'wiedervorlage');

-- CreateEnum
CREATE TYPE "verkaufschance_priority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "advisory_dossier_type" AS ENUM ('kk_vergleich', 'vorsorge', 'sachversicherung', 'gesamtdossier');

-- CreateEnum
CREATE TYPE "advisory_dossier_status" AS ENUM ('entwurf', 'in_bearbeitung', 'bereit', 'archiviert');

-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('offen', 'ki_analysiert', 'in_pruefung', 'berater_angepasst', 'freigegeben', 'needs_reapproval');

-- CreateEnum
CREATE TYPE "ai_risk_level" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "mutation_request_type" AS ENUM ('address_change', 'coverage_change', 'vehicle_change', 'other');

-- CreateEnum
CREATE TYPE "mutation_request_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "pricing_suggestion_priority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "pricing_suggestion_status" AS ENUM ('pending', 'approved', 'rejected', 'implemented');

-- CreateEnum
CREATE TYPE "email_campaign_status" AS ENUM ('draft', 'scheduled', 'sent', 'cancelled');

-- CreateEnum
CREATE TYPE "email_campaign_filter_status" AS ENUM ('all', 'active', 'inactive', 'prospect');

-- CreateEnum
CREATE TYPE "email_template_category" AS ENUM ('cancellation', 'renewal', 'appointment', 'document_request', 'claim', 'general');

-- CreateEnum
CREATE TYPE "interaction_type" AS ENUM ('anruf', 'meeting', 'email', 'notiz', 'dokument');

-- CreateEnum
CREATE TYPE "interaction_request_status" AS ENUM ('offen', 'in_bearbeitung', 'erledigt');

-- CreateEnum
CREATE TYPE "pattern_type" AS ENUM ('field_signal', 'role_mapping', 'product_indicator', 'layout_rule', 'date_format', 'premium_location');

-- CreateEnum
CREATE TYPE "enterprise_improvement_priority" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "enterprise_improvement_area" AS ENUM ('performance', 'relationship_integrity', 'ai_quality', 'query_governance', 'design', 'mobile', 'workflow');

-- CreateEnum
CREATE TYPE "enterprise_improvement_status" AS ENUM ('proposed', 'approved', 'in_progress', 'implemented', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "effort_level" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "enterprise_incident_priority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "enterprise_incident_severity" AS ENUM ('info', 'warning', 'critical', 'blocking');

-- CreateEnum
CREATE TYPE "enterprise_incident_category" AS ENUM ('export_gate', 'approval', 'snapshots', 'tenant_isolation', 'data_integrity', 'audit_trail', 'pdf_integrity', 'security', 'document_integrity', 'recovery', 'performance', 'sla_breach', 'other');

-- CreateEnum
CREATE TYPE "enterprise_incident_status" AS ENUM ('open', 'investigating', 'root_cause_identified', 'mitigation_active', 'in_progress', 'resolved', 'closed', 'rejected', 'accepted_risk', 'auto_fixed');

-- CreateEnum
CREATE TYPE "root_cause_cluster" AS ENUM ('approval_metadata', 'audit_trail_integrity', 'storno_financial_audit', 'data_relationship_integrity', 'governance_architecture', 'ai_transparency', 'security_boundaries', 'incident_management', 'none');

-- CreateEnum
CREATE TYPE "sla_status" AS ENUM ('ok', 'warning', 'breached');

-- CreateEnum
CREATE TYPE "governance_rule_layer" AS ENUM ('WARNING', 'VALIDATION', 'GOVERNANCE_BLOCK', 'SECURITY_BLOCK');

-- CreateEnum
CREATE TYPE "governance_business_criticality" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "governance_enforcement_mode" AS ENUM ('monitor', 'enforce', 'strict');

-- CreateEnum
CREATE TYPE "governance_rule_status" AS ENUM ('draft', 'testing', 'active', 'deprecated', 'archived');

-- CreateEnum
CREATE TYPE "governance_rule_scope" AS ENUM ('GLOBAL', 'ORGANIZATION', 'ENTITY', 'FEATURE');

-- CreateEnum
CREATE TYPE "governance_event_type" AS ENUM ('create', 'update', 'delete', 'read');

-- CreateEnum
CREATE TYPE "governance_risk_level" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "governance_trend" AS ENUM ('up', 'down', 'stable');

-- CreateEnum
CREATE TYPE "duplicate_alert_entity_type" AS ENUM ('customer', 'application', 'contract');

-- CreateEnum
CREATE TYPE "duplicate_match_criteria" AS ENUM ('email', 'phone', 'mobile', 'policy_number', 'name_birthdate', 'ahv_number');

-- CreateEnum
CREATE TYPE "duplicate_alert_status" AS ENUM ('new', 'verified', 'merged', 'dismissed', 'false_positive');

-- CreateEnum
CREATE TYPE "backup_type" AS ENUM ('incremental', 'full', 'long_term', 'archive');

-- CreateEnum
CREATE TYPE "backup_status" AS ENUM ('completed', 'failed', 'partial');

-- CreateEnum
CREATE TYPE "error_type" AS ENUM ('upload_failed', 'automation_failed', 'ocr_error', 'loading_error', 'sync_error', 'dashboard_error', 'validation_error', 'other');

-- CreateEnum
CREATE TYPE "error_log_status" AS ENUM ('new', 'reviewed', 'resolved', 'ignored');

-- CreateEnum
CREATE TYPE "extraction_error_type" AS ENUM ('role_error', 'ocr_error', 'product_error', 'date_error', 'premium_error', 'address_error', 'coverage_error', 'unknown');

-- CreateEnum
CREATE TYPE "automation_job_type" AS ENUM ('ki_extraction', 'document_classification', 'customer_sync', 'commission_calc', 'notification', 'other');

-- CreateEnum
CREATE TYPE "automation_job_status" AS ENUM ('pending', 'processing', 'done', 'failed');

-- CreateEnum
CREATE TYPE "ai_finding_type" AS ENUM ('tenant_violation', 'missing_required_field', 'orphan_relationship', 'compliance_gap', 'data_quality', 'sla_risk', 'approval_missing', 'audit_gap', 'financial_inconsistency', 'duplicate_detected', 'pricing_anomaly', 'churn_risk', 'coverage_gap', 'other');

-- CreateEnum
CREATE TYPE "finding_severity" AS ENUM ('info', 'warning', 'critical', 'blocking');

-- CreateEnum
CREATE TYPE "evidence_strength" AS ENUM ('weak', 'moderate', 'strong', 'conclusive');

-- CreateEnum
CREATE TYPE "false_positive_risk" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "detection_method" AS ENUM ('rule_based', 'ai_inference', 'statistical', 'hybrid');

-- CreateEnum
CREATE TYPE "hallucination_risk" AS ENUM ('none', 'low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "finding_status" AS ENUM ('new', 'under_review', 'confirmed', 'resolved', 'false_positive', 'accepted_risk');

-- CreateEnum
CREATE TYPE "review_decision" AS ENUM ('pending', 'confirmed', 'rejected_false_positive', 'escalated');

-- CreateEnum
CREATE TYPE "ai_review_level" AS ENUM ('quick', 'operational', 'enterprise');

-- CreateEnum
CREATE TYPE "ai_review_status" AS ENUM ('completed', 'in_progress');

-- CreateEnum
CREATE TYPE "contract_advisor_role" AS ENUM ('primary', 'co_advisor', 'assistant', 'specialist');

-- CreateEnum
CREATE TYPE "customer_advisor_role" AS ENUM ('primary', 'co_advisor', 'assistant', 'specialist');

-- CreateEnum
CREATE TYPE "system_log_level" AS ENUM ('info', 'warn', 'error', 'critical');

-- CreateEnum
CREATE TYPE "audit_event_type" AS ENUM ('create', 'update', 'delete', 'archive', 'restore', 'block', 'skip', 'allow', 'reject');

-- CreateEnum
CREATE TYPE "audit_entity_type" AS ENUM ('customer', 'application', 'contract', 'commission', 'task', 'document', 'organization', 'advisor');

-- CreateEnum
CREATE TYPE "trigger_type" AS ENUM ('entity_create', 'entity_update', 'entity_delete', 'scheduled', 'manual', 'api', 'migration');

-- CreateEnum
CREATE TYPE "actor_type" AS ENUM ('user', 'automation', 'scheduler', 'system', 'migration', 'api');

-- CreateEnum
CREATE TYPE "guard_result" AS ENUM ('allowed', 'blocked', 'skipped', 'error');

-- CreateEnum
CREATE TYPE "business_severity_type" AS ENUM ('financial', 'compliance', 'customer_impact', 'operational', 'critical');

-- CreateEnum
CREATE TYPE "business_severity_level" AS ENUM ('critical', 'high', 'medium', 'low', 'info');

-- CreateEnum
CREATE TYPE "technical_severity_type" AS ENUM ('error', 'warning', 'info', 'debug');

-- CreateEnum
CREATE TYPE "technical_severity_level" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "recovery_strategy" AS ENUM ('retry', 'fallback', 'manual_intervention');

-- CreateEnum
CREATE TYPE "anomaly_type" AS ENUM ('duplicate_spike', 'task_flood', 'renewal_loop', 'status_churn');

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "organization_type" NOT NULL DEFAULT 'broker',
    "status" TEXT NOT NULL DEFAULT 'active',
    "finma_number" TEXT,
    "street" TEXT,
    "zip_code" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "works_with_address_brokers" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "role" TEXT NOT NULL DEFAULT 'broker',
    "team_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "mobile" TEXT,
    "department" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT,
    "last_login" TIMESTAMP(3),
    "reset_token_hash" TEXT,
    "reset_token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisor" (
    "id" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "organization_id" TEXT NOT NULL,
    "organization_name" TEXT,
    "role" "advisor_role" NOT NULL DEFAULT 'advisor',
    "status" TEXT NOT NULL DEFAULT 'active',
    "finma_number" TEXT,
    "vbv_number" TEXT,
    "total_commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paid_commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "open_commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "advisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "firstname" TEXT,
    "lastname" TEXT,
    "phone" TEXT,
    "organization_id" TEXT,
    "organization_name" TEXT,
    "finma_number" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "broker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "customer_number" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "street" TEXT,
    "zip_code" TEXT,
    "city" TEXT,
    "canton" "swiss_canton",
    "birthdate" TIMESTAMP(3),
    "ahv_number" TEXT,
    "civil_status" "civil_status",
    "profession" TEXT,
    "nationality" TEXT,
    "drivers_license_date" TIMESTAMP(3),
    "bank_account" TEXT,
    "risk_profile" TEXT,
    "customer_type" "customer_type" NOT NULL DEFAULT 'private',
    "status" "customer_status" NOT NULL DEFAULT 'active',
    "mandate_status" "mandate_status" NOT NULL DEFAULT 'pending',
    "association_membership" TEXT,
    "permit_type" TEXT,
    "is_family_member" BOOLEAN NOT NULL DEFAULT false,
    "primary_customer_id" TEXT,
    "family_role" TEXT NOT NULL DEFAULT 'primary',
    "notes" TEXT,
    "assigned_broker" TEXT,
    "portal_enabled" BOOLEAN NOT NULL DEFAULT false,
    "portal_password_hash" TEXT,
    "portal_must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "portal_password_last_changed" TIMESTAMP(3),
    "portal_last_login" TIMESTAMP(3),
    "company_name" TEXT,
    "legal_form" TEXT,
    "uid_number" TEXT,
    "industry" TEXT,
    "contact_person_firstname" TEXT,
    "contact_person_lastname" TEXT,
    "organization_id" TEXT NOT NULL,
    "teamlead_id" TEXT,
    "advisor_id" TEXT,
    "total_premium" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "import_batch_id" TEXT,
    "imported_at" TIMESTAMP(3),
    "imported_by" TEXT,
    "primary_advisor_id" TEXT,
    "assigned_advisors" TEXT[],
    "assigned_assistants" TEXT[],
    "access_level" TEXT NOT NULL DEFAULT 'assigned_advisors_only',
    "change_history" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "primary_customer_id" TEXT,
    "is_family_member" BOOLEAN NOT NULL DEFAULT false,
    "organization_id" TEXT NOT NULL,
    "advisor_id" TEXT,
    "insurer" TEXT NOT NULL,
    "policy_number" TEXT,
    "version_number" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "parent_policy_id" TEXT,
    "insurance_type" "insurance_type" NOT NULL,
    "product" TEXT,
    "premium_monthly" DOUBLE PRECISION,
    "premium_yearly" DOUBLE PRECISION,
    "premium_current" DOUBLE PRECISION,
    "premium_previous" DOUBLE PRECISION,
    "premium_benchmark" DOUBLE PRECISION,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "acceptance_date" TIMESTAMP(3),
    "renewal_date" TIMESTAMP(3),
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "cancellation_deadline" TIMESTAMP(3),
    "cancel_date" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "storno_period_months" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "status" "contract_status" NOT NULL DEFAULT 'active',
    "process_status" "process_status" NOT NULL DEFAULT 'neu',
    "custom_status" TEXT,
    "sparte" TEXT,
    "sparte_data" JSONB,
    "commission_rate" DOUBLE PRECISION,
    "commission_amount" DOUBLE PRECISION,
    "assigned_broker" TEXT,
    "policy_document_url" TEXT,
    "source_application_id" TEXT,
    "renewal_alert_start_date" TIMESTAMP(3),
    "renewal_status" TEXT NOT NULL DEFAULT 'none',
    "renewal_last_reminder" TIMESTAMP(3),
    "renewal_priority" TEXT NOT NULL DEFAULT 'low',
    "renewal_stage" TEXT NOT NULL DEFAULT 'early',
    "renewal_stage_updated" TIMESTAMP(3),
    "renewal_offer_created" BOOLEAN NOT NULL DEFAULT false,
    "renewal_offer_status" TEXT NOT NULL DEFAULT 'none',
    "renewal_offer_date" TIMESTAMP(3),
    "renewal_offer_policy_id" TEXT,
    "renewal_customer_accepted" BOOLEAN NOT NULL DEFAULT false,
    "renewal_accepted_date" TIMESTAMP(3),
    "renewal_last_activity" TIMESTAMP(3),
    "upsell_stage" TEXT NOT NULL DEFAULT 'identified',
    "upsell_stage_updated" TIMESTAMP(3),
    "upsell_identified_reason" TEXT,
    "upsell_potential_value" DOUBLE PRECISION,
    "upsell_potential_percent" DOUBLE PRECISION,
    "upsell_offer_created" BOOLEAN NOT NULL DEFAULT false,
    "upsell_offer_status" TEXT NOT NULL DEFAULT 'none',
    "upsell_offer_date" TIMESTAMP(3),
    "upsell_offer_value" DOUBLE PRECISION,
    "upsell_accepted_date" TIMESTAMP(3),
    "upsell_last_activity" TIMESTAMP(3),
    "pricing_status" TEXT NOT NULL DEFAULT 'normal',
    "pricing_suggestion_id" TEXT,
    "last_review_date" TIMESTAMP(3),
    "next_review_date" TIMESTAMP(3),
    "notes" TEXT,
    "primary_broker_id" TEXT,
    "assigned_brokers" TEXT[],
    "assigned_team" TEXT[],
    "access_level" TEXT NOT NULL DEFAULT 'assigned_brokers_only',
    "requires_review" BOOLEAN NOT NULL DEFAULT false,
    "date_quality_status" TEXT NOT NULL DEFAULT 'verified',
    "change_history" JSONB,
    "non_renewal_reason" TEXT,
    "ai_non_renewal_suggestion" TEXT,
    "exclude_from_renewal_statistics" BOOLEAN NOT NULL DEFAULT false,
    "renewal_statistics_note" TEXT,
    "cancellation_status" TEXT NOT NULL DEFAULT 'none',
    "cancellation_type" TEXT,
    "cancellation_structured_reason" TEXT,
    "cancellation_submitted_at" TIMESTAMP(3),
    "cancellation_effective_date" TIMESTAMP(3),
    "cancellation_notice_period_days" DOUBLE PRECISION,
    "cancellation_deadline_ok" BOOLEAN,
    "cancellation_confirmed_by_insurer" BOOLEAN NOT NULL DEFAULT false,
    "cancellation_confirmation_date" TIMESTAMP(3),
    "cancellation_doc_url" TEXT,
    "cancellation_notes" TEXT,
    "retention_attempted" BOOLEAN NOT NULL DEFAULT false,
    "retention_counter_offer_created" BOOLEAN NOT NULL DEFAULT false,
    "retention_result" TEXT NOT NULL DEFAULT 'none',
    "retention_notes" TEXT,
    "successor_contract_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "primary_customer_id" TEXT,
    "is_family_member" BOOLEAN NOT NULL DEFAULT false,
    "organization_id" TEXT NOT NULL,
    "advisor_id" TEXT,
    "kundentyp" TEXT NOT NULL DEFAULT 'privat',
    "sparte" TEXT,
    "sparte_data" JSONB,
    "insurance_type" TEXT,
    "product" TEXT,
    "insurer" TEXT NOT NULL,
    "status" "application_status" NOT NULL DEFAULT 'new',
    "custom_status" TEXT,
    "status_changed_at" TIMESTAMP(3),
    "status_history" JSONB,
    "estimated_premium_monthly" DOUBLE PRECISION,
    "estimated_premium_yearly" DOUBLE PRECISION,
    "requested_start_date" TIMESTAMP(3),
    "policy_number" TEXT,
    "contract_start_date" TIMESTAMP(3),
    "contract_end_date" TIMESTAMP(3),
    "commission_estimate" DOUBLE PRECISION,
    "assigned_broker" TEXT,
    "linked_contract_id" TEXT,
    "abloese_contract_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "broker_email" TEXT,
    "broker_name" TEXT,
    "type" "commission_type" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "insurance_type" TEXT,
    "provider" TEXT,
    "date" TIMESTAMP(3),
    "status" "commission_status" NOT NULL DEFAULT 'offen',
    "organization_id" TEXT,
    "advisor_id" TEXT,
    "insurer" TEXT,
    "policy_number" TEXT,
    "rate" DOUBLE PRECISION,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "calculated_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "paid_by" TEXT,
    "storno_risk_months" INTEGER,
    "storno_status" TEXT,
    "storno_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_entry" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT,
    "policy_number" TEXT,
    "advisor_id" TEXT NOT NULL,
    "advisor_name" TEXT,
    "organization_id" TEXT NOT NULL,
    "organization_name" TEXT,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "insurer" TEXT NOT NULL,
    "product_category" TEXT,
    "premium_yearly" DOUBLE PRECISION NOT NULL,
    "start_date" TIMESTAMP(3),
    "company_courtage_amount" DOUBLE PRECISION,
    "advisor_courtage_percentage" DOUBLE PRECISION,
    "advisor_courtage_amount" DOUBLE PRECISION,
    "courtage_storno_percentage" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "courtage_storno_amount" DOUBLE PRECISION,
    "courtage_payout_amount" DOUBLE PRECISION,
    "courtage_received_date" TIMESTAMP(3),
    "courtage_status" "commission_entry_status" NOT NULL DEFAULT 'pending',
    "courtage_invoiced_date" TIMESTAMP(3),
    "courtage_earned_date" TIMESTAMP(3),
    "courtage_paid_date" TIMESTAMP(3),
    "company_provision_amount" DOUBLE PRECISION,
    "advisor_provision_percentage" DOUBLE PRECISION,
    "advisor_provision_amount" DOUBLE PRECISION,
    "provision_storno_percentage" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "provision_storno_amount" DOUBLE PRECISION,
    "provision_payout_amount" DOUBLE PRECISION,
    "provision_received_date" TIMESTAMP(3),
    "provision_status" "commission_entry_status" NOT NULL DEFAULT 'pending',
    "provision_invoiced_date" TIMESTAMP(3),
    "provision_earned_date" TIMESTAMP(3),
    "provision_paid_date" TIMESTAMP(3),
    "abschlussprovision_courtage" DOUBLE PRECISION,
    "abschlussprovision_provision" DOUBLE PRECISION,
    "bruttoentschaedigung_courtage" DOUBLE PRECISION,
    "bruttoentschaedigung_provision" DOUBLE PRECISION,
    "storno_datum" TIMESTAMP(3),
    "storno_reference_id" TEXT,
    "storno_ursprung_courtage_brutto" DOUBLE PRECISION,
    "storno_ursprung_provision_brutto" DOUBLE PRECISION,
    "storno_ursprung_courtage_netto" DOUBLE PRECISION,
    "storno_ursprung_provision_netto" DOUBLE PRECISION,
    "storno_war_ausbezahlt" BOOLEAN NOT NULL DEFAULT false,
    "storno_rueckforderungsbetrag" DOUBLE PRECISION,
    "storno_grund" TEXT,
    "status" "commission_entry_status" NOT NULL DEFAULT 'pending',
    "entry_date" TIMESTAMP(3),
    "commission_percentage" DOUBLE PRECISION,
    "commission_amount" DOUBLE PRECISION,
    "received_amount" DOUBLE PRECISION,
    "received_date" TIMESTAMP(3),
    "invoiced_date" TIMESTAMP(3),
    "earned_date" TIMESTAMP(3),
    "paid_date" TIMESTAMP(3),
    "payout_id" TEXT,
    "storno_period_months" DOUBLE PRECISION,
    "storno_eligible_until" TIMESTAMP(3),
    "is_storno" BOOLEAN NOT NULL DEFAULT false,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "commission_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rate" (
    "id" TEXT NOT NULL,
    "broker_email" TEXT NOT NULL,
    "broker_name" TEXT,
    "sparte" TEXT NOT NULL,
    "rate_percent" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "commission_rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_split" (
    "id" TEXT NOT NULL,
    "commission_entry_id" TEXT NOT NULL,
    "advisor_id" TEXT NOT NULL,
    "advisor_name" TEXT,
    "teamlead_id" TEXT,
    "teamlead_name" TEXT,
    "organization_id" TEXT NOT NULL,
    "advisor_share_percent" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "advisor_share_amount" DOUBLE PRECISION NOT NULL,
    "teamlead_share_percent" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "teamlead_share_amount" DOUBLE PRECISION,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "commission_split_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "primary_customer_id" TEXT,
    "is_family_member" BOOLEAN NOT NULL DEFAULT false,
    "customer_locked" BOOLEAN NOT NULL DEFAULT false,
    "processing_stage" "document_processing_stage" NOT NULL DEFAULT 'uploaded',
    "policy_holder_name" TEXT,
    "driver_name" TEXT,
    "insured_person_name" TEXT,
    "name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_key" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "file_hash" TEXT,
    "version" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "immutable" BOOLEAN NOT NULL DEFAULT false,
    "category" "document_category",
    "doc_type" "document_doc_type" NOT NULL DEFAULT 'unbekannt',
    "classification_status" "document_classification_status" NOT NULL DEFAULT 'ausstehend',
    "classification_confidence" DOUBLE PRECISION,
    "classification_reason" TEXT,
    "linked_contract_id" TEXT,
    "linked_application_id" TEXT,
    "uploaded_by" TEXT,
    "uploaded_at" TIMESTAMP(3),
    "notes" TEXT,
    "access_advisors" TEXT[],
    "access_teams" TEXT[],
    "access_level" TEXT NOT NULL DEFAULT 'assigned_advisors_only',
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "contract_id" TEXT,
    "application_id" TEXT,
    "application_name" TEXT,
    "assigned_to" TEXT,
    "priority" "task_priority" NOT NULL DEFAULT 'medium',
    "status" "task_status" NOT NULL DEFAULT 'open',
    "due_date" TIMESTAMP(3),
    "completion_date" TIMESTAMP(3),
    "task_type" "task_type" NOT NULL DEFAULT 'general',
    "notes" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "birthdate" TIMESTAMP(3),
    "company" TEXT,
    "source" "lead_source" NOT NULL,
    "advisor_id" TEXT,
    "advisor_name" TEXT,
    "organization_id" TEXT,
    "status" "lead_status" NOT NULL DEFAULT 'new',
    "customer_id" TEXT,
    "notes" TEXT,
    "last_contact_date" TIMESTAMP(3),
    "converted_at" TIMESTAMP(3),
    "lost_reason" TEXT,
    "lead_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "autopilot_status" "lead_autopilot_status" NOT NULL DEFAULT 'off',
    "offer_status" "lead_offer_status" NOT NULL DEFAULT 'none',
    "offer_prepared_date" TIMESTAMP(3),
    "offer_sent_date" TIMESTAMP(3),
    "last_followup_sent" TIMESTAMP(3),
    "conversion_probability" DOUBLE PRECISION,
    "documents" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "audit_schema_version" TEXT NOT NULL DEFAULT '1.0',
    "audit_id" TEXT NOT NULL,
    "audit_level" INTEGER NOT NULL DEFAULT 2,
    "audit_level_name" TEXT NOT NULL DEFAULT 'lifecycle_transition',
    "timestamp" TIMESTAMP(3) NOT NULL,
    "trigger_type" "trigger_type" NOT NULL,
    "trigger_source" TEXT,
    "actor_type" "actor_type" NOT NULL,
    "actor_id" TEXT,
    "actor_name" TEXT,
    "organization_id" TEXT,
    "process_id" TEXT,
    "process_type" TEXT,
    "process_stage" TEXT,
    "event_id" TEXT,
    "event_type" TEXT,
    "event_sequence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "entity_type" "audit_entity_type" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" "audit_event_type" NOT NULL,
    "decision_code" TEXT,
    "decision_logic" TEXT,
    "guard_evaluated" TEXT,
    "guard_result" "guard_result",
    "guard_reason" TEXT,
    "business_severity_type" "business_severity_type",
    "business_severity_level" "business_severity_level",
    "technical_severity_type" "technical_severity_type",
    "technical_severity_level" "technical_severity_level",
    "previous_state_summary" JSONB,
    "new_state_summary" JSONB,
    "side_effects" JSONB,
    "business_impact_financial_chf" DOUBLE PRECISION,
    "business_impact_description" TEXT,
    "retry_attempt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retry_of_event_id" TEXT,
    "recovered" BOOLEAN NOT NULL DEFAULT false,
    "recovery_strategy" "recovery_strategy",
    "original_error" TEXT,
    "anomaly_detected" BOOLEAN NOT NULL DEFAULT false,
    "anomaly_type" "anomaly_type",
    "anomaly_score" DOUBLE PRECISION,
    "correlation_id" TEXT,
    "related_entities" JSONB,
    "ip_address" TEXT,
    "duration_ms" DOUBLE PRECISION,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_log" (
    "id" TEXT NOT NULL,
    "level" "system_log_level" NOT NULL DEFAULT 'info',
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "related_entity_type" TEXT,
    "related_entity_id" TEXT,
    "user_email" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "system_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "type" "notification_type" NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "recipient_name" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "reference_id" TEXT,
    "reference_type" TEXT,
    "status" "notification_status" NOT NULL DEFAULT 'sent',
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "sender_email" TEXT,
    "sender_name" TEXT,
    "content" TEXT NOT NULL,
    "is_from_customer" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "reference_id" TEXT,
    "reference_type" "message_reference_type" NOT NULL DEFAULT 'general',
    "reference_title" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_definition" (
    "id" TEXT NOT NULL,
    "type" "status_definition_type" NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" "status_color" NOT NULL DEFAULT 'gray',
    "category" "status_category" NOT NULL DEFAULT 'offen',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata_fields" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "status_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" TEXT NOT NULL,
    "entity_type" "status_history_entity_type" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "to_status_label" TEXT,
    "changed_by_email" TEXT,
    "note" TEXT,
    "metadata" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bag_praemien_daten" (
    "id" TEXT NOT NULL,
    "jahr" INTEGER NOT NULL,
    "krankenkasse" TEXT NOT NULL,
    "kanton" TEXT NOT NULL,
    "region" TEXT,
    "modell" "bag_modell" NOT NULL,
    "modell_label" TEXT NOT NULL,
    "franchise" INTEGER NOT NULL,
    "unfall" BOOLEAN NOT NULL DEFAULT false,
    "altersklasse" "bag_altersklasse",
    "praemie_erwachsene" DOUBLE PRECISION NOT NULL,
    "praemie_kinder" DOUBLE PRECISION,
    "geschlecht" "bag_geschlecht",
    "alter_von" INTEGER,
    "alter_bis" INTEGER,
    "datenquelle" TEXT NOT NULL DEFAULT 'BAG',
    "importiert_am" TIMESTAMP(3),
    "importiert_von" TEXT,
    "gueltig_ab" TIMESTAMP(3),
    "gueltig_bis" TIMESTAMP(3),
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "bag_praemien_daten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "krankenkassen_vergleich" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "advisor_id" TEXT,
    "advisor_name" TEXT,
    "organization_id" TEXT NOT NULL,
    "vergleichsdatum" TIMESTAMP(3) NOT NULL,
    "persoenliche_daten" JSONB,
    "aktuelle_versicherung" JSONB,
    "vergleichsoptionen" JSONB,
    "vergleichsergebnisse" JSONB,
    "ki_analyse" JSONB,
    "status" "krankenkassen_vergleich_status" NOT NULL DEFAULT 'durchgefuehrt',
    "pdf_url" TEXT,
    "wiedervorlage_datum" TIMESTAMP(3),
    "notizen" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "krankenkassen_vergleich_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparison_entry" (
    "id" TEXT NOT NULL,
    "dossier_id" TEXT NOT NULL,
    "person_name" TEXT NOT NULL,
    "family_member_id" TEXT,
    "gruppe" "comparison_group" NOT NULL DEFAULT 'manuell',
    "gruppe_label" TEXT,
    "section" "comparison_section" NOT NULL DEFAULT 'grundversicherung',
    "gesellschaft" TEXT NOT NULL,
    "product_name" TEXT,
    "praemie_monatlich" DOUBLE PRECISION,
    "franchise" DOUBLE PRECISION,
    "modell" TEXT,
    "leistungs_score" DOUBLE PRECISION,
    "deckung_details" TEXT,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "is_recommended" BOOLEAN NOT NULL DEFAULT false,
    "ai_extracted" BOOLEAN NOT NULL DEFAULT false,
    "ai_confidence" DOUBLE PRECISION,
    "ai_source_document" TEXT,
    "manually_verified" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "comparison_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vergleichs_analyse" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "advisor_id" TEXT,
    "advisor_name" TEXT,
    "organization_id" TEXT NOT NULL,
    "analyse_datum" TIMESTAMP(3) NOT NULL,
    "persoenliche_daten" JSONB,
    "ausgangslage" JSONB,
    "empfehlung" JSONB,
    "beratungsergebnis" JSONB,
    "status" "vergleichs_analyse_status" NOT NULL DEFAULT 'analyse_laeuft',
    "pdf_url" TEXT,
    "notizen" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "vergleichs_analyse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_entry" (
    "id" TEXT NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "entry_type" "accounting_entry_type" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "advisor_id" TEXT NOT NULL,
    "advisor_name" TEXT,
    "organization_id" TEXT NOT NULL,
    "organization_name" TEXT,
    "policy_id" TEXT,
    "policy_number" TEXT,
    "insurer" TEXT,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "status" "accounting_entry_status" NOT NULL DEFAULT 'pending',
    "reference_type" "accounting_reference_type",
    "reference_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "accounting_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout" (
    "id" TEXT NOT NULL,
    "advisor_id" TEXT NOT NULL,
    "advisor_name" TEXT,
    "organization_id" TEXT NOT NULL,
    "organization_name" TEXT,
    "payout_month" TIMESTAMP(3) NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "commission_count" DOUBLE PRECISION,
    "status" "payout_status" NOT NULL DEFAULT 'draft',
    "approved_date" TIMESTAMP(3),
    "approved_by" TEXT,
    "paid_date" TIMESTAMP(3),
    "bank_reference" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_period" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "status" "finance_period_status" NOT NULL DEFAULT 'open',
    "closed_date" TIMESTAMP(3),
    "closed_by" TEXT,
    "total_commissions" DOUBLE PRECISION,
    "total_payouts" DOUBLE PRECISION,
    "notes" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "finance_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storno_config" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "global_storno_percent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "storno_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ausschreibung" (
    "id" TEXT NOT NULL,
    "ausschreibung_nummer" TEXT,
    "titel" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "ansprechpartner" TEXT,
    "broker_id" TEXT,
    "broker_name" TEXT,
    "organization_id" TEXT NOT NULL,
    "versicherungsbereich" "ausschreibung_bereich",
    "sparten" TEXT[],
    "status" "ausschreibung_status" NOT NULL DEFAULT 'entwurf',
    "prioritaet" "ausschreibung_prioritaet" NOT NULL DEFAULT 'mittel',
    "ausschreibungsdatum" TIMESTAMP(3),
    "versanddatum" TIMESTAMP(3),
    "fristdatum" TIMESTAMP(3),
    "praesentationsdatum" TIMESTAMP(3),
    "abschlussdatum" TIMESTAMP(3),
    "risiko_daten" JSONB,
    "ausgewaehlte_versicherer" JSONB,
    "bemerkungen" TEXT,
    "ki_analyse" JSONB,
    "ki_empfehlung_text" TEXT,
    "ki_empfohlener_versicherer" TEXT,
    "gewinner_versicherer" TEXT,
    "gewinner_offerte_id" TEXT,
    "verlust_grund" TEXT,
    "dokument_urls" TEXT[],
    "tags" TEXT[],
    "offerten_count" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "laufende_praemie" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "ausschreibung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offerte" (
    "id" TEXT NOT NULL,
    "ausschreibung_id" TEXT NOT NULL,
    "ausschreibung_titel" TEXT,
    "versicherer_id" TEXT,
    "versicherer_name" TEXT NOT NULL,
    "customer_id" TEXT,
    "organization_id" TEXT NOT NULL,
    "offert_nummer" TEXT,
    "praemie_jaehrlich" DOUBLE PRECISION,
    "praemie_monatlich" DOUBLE PRECISION,
    "selbstbehalt" TEXT,
    "deckung_beschreibung" TEXT,
    "zusatzleistungen" TEXT[],
    "ausschluesse" TEXT[],
    "laufzeit" TEXT,
    "kuendigungsfrist" TEXT,
    "besondere_bedingungen" TEXT,
    "status" "offerte_status" NOT NULL DEFAULT 'ausstehend',
    "erfassungsdatum" TIMESTAMP(3),
    "gueltig_bis" TIMESTAMP(3),
    "dokument_url" TEXT,
    "ki_score" DOUBLE PRECISION,
    "ki_preis_score" DOUBLE PRECISION,
    "ki_deckungs_score" DOUBLE PRECISION,
    "ki_risiko_score" DOUBLE PRECISION,
    "ki_service_score" DOUBLE PRECISION,
    "ki_flexibilitaet_score" DOUBLE PRECISION,
    "ki_analyse_text" TEXT,
    "ki_staerken" TEXT[],
    "ki_schwaechen" TEXT[],
    "ki_risiken" TEXT[],
    "ist_empfohlen" BOOLEAN NOT NULL DEFAULT false,
    "ist_guenstigste" BOOLEAN NOT NULL DEFAULT false,
    "ist_beste_deckung" BOOLEAN NOT NULL DEFAULT false,
    "deckungsluecken" TEXT[],
    "sparten_daten" JSONB,
    "notizen" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "offerte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versicherer_db" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kurzname" TEXT,
    "kontaktperson" TEXT,
    "funktion" TEXT,
    "email" TEXT,
    "telefon" TEXT,
    "adresse" TEXT,
    "plz" TEXT,
    "ort" TEXT,
    "website" TEXT,
    "bearbeitungszeit_tage" DOUBLE PRECISION,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "bewertung" DOUBLE PRECISION,
    "spezialisierungen" TEXT[],
    "bevorzugter_kanal" TEXT,
    "portal_url" TEXT,
    "notizen" TEXT,
    "logo_url" TEXT,
    "ausschreibungen_gesamt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ausschreibungen_gewonnen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durchschnittliche_antwortzeit_tage" DOUBLE PRECISION,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "versicherer_db_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "partner_category" NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "street" TEXT,
    "zip_code" TEXT,
    "city" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "status" "partner_status" NOT NULL DEFAULT 'aktiv',
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_activity" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "partner_name" TEXT,
    "activity_type" "partner_activity_type" NOT NULL,
    "description" TEXT NOT NULL,
    "document_id" TEXT,
    "document_name" TEXT,
    "performed_by" TEXT,
    "performed_by_name" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "partner_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_document" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "partner_name" TEXT,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "category" "partner_document_category" NOT NULL,
    "uploaded_by" TEXT,
    "uploaded_by_name" TEXT,
    "file_size" DOUBLE PRECISION,
    "notes" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "partner_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "customer_email" TEXT,
    "contract_id" TEXT,
    "insurance_type" TEXT,
    "provider" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "incident_date" TIMESTAMP(3) NOT NULL,
    "status" "claim_status" NOT NULL DEFAULT 'eingereicht',
    "claim_number" TEXT,
    "amount_claimed" DOUBLE PRECISION,
    "amount_approved" DOUBLE PRECISION,
    "documents" JSONB,
    "broker_notes" TEXT,
    "organization_id" TEXT,
    "advisor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "stage" "deal_stage" NOT NULL DEFAULT 'erstkontakt',
    "insurance_type" "deal_insurance_type",
    "estimated_premium" DOUBLE PRECISION,
    "probability" DOUBLE PRECISION,
    "assigned_broker" TEXT,
    "next_action" TEXT,
    "next_action_date" TIMESTAMP(3),
    "notes" TEXT,
    "source" "deal_source" NOT NULL DEFAULT 'sonstiges',
    "customer_id" TEXT,
    "organization_id" TEXT,
    "advisor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verkaufschance" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "organization_id" TEXT NOT NULL,
    "advisor_id" TEXT,
    "assigned_broker" TEXT,
    "linked_contract_id" TEXT,
    "contact_person" TEXT,
    "sparte" TEXT NOT NULL,
    "insurance_type" TEXT,
    "status" "verkaufschance_status" NOT NULL DEFAULT 'neu',
    "priority" "verkaufschance_priority" NOT NULL DEFAULT 'medium',
    "estimated_value" DOUBLE PRECISION,
    "expected_close_date" TIMESTAMP(3),
    "start_date_requested" TIMESTAMP(3),
    "selected_insurer" TEXT,
    "won_contract_id" TEXT,
    "lost_reason" TEXT,
    "wiedervorlage_date" TIMESTAMP(3),
    "gesellschaften" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "verkaufschance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisory_dossier" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "advisor_id" TEXT,
    "organization_id" TEXT,
    "title" TEXT NOT NULL,
    "dossier_type" "advisory_dossier_type" NOT NULL DEFAULT 'kk_vergleich',
    "status" "advisory_dossier_status" NOT NULL DEFAULT 'entwurf',
    "review_status" "review_status" NOT NULL DEFAULT 'offen',
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "total_current_premium" DOUBLE PRECISION,
    "total_proposed_premium" DOUBLE PRECISION,
    "savings_monthly" DOUBLE PRECISION,
    "recommendation_notes" TEXT,
    "linked_verkaufschance_id" TEXT,
    "version" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "is_latest" BOOLEAN NOT NULL DEFAULT true,
    "advisor_final_recommendation" TEXT,
    "advisor_recommendation_label" TEXT,
    "advisor_recommendation_reason" TEXT,
    "advisor_recommendation_highlights" TEXT,
    "advisor_approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_version" DOUBLE PRECISION,
    "approved_snapshot_id" TEXT,
    "reapproval_required" BOOLEAN NOT NULL DEFAULT false,
    "reapproval_reason" TEXT,
    "revoked_at" TIMESTAMP(3),
    "revoked_by" TEXT,
    "extraction_confidence" DOUBLE PRECISION,
    "review_confidence" DOUBLE PRECISION,
    "requires_manual_review" BOOLEAN NOT NULL DEFAULT false,
    "ai_risk_level" "ai_risk_level",
    "confidence_reason" TEXT,
    "final_pdf_url" TEXT,
    "final_pdf_file_uri" TEXT,
    "final_pdf_hash" TEXT,
    "final_pdf_generated_by" TEXT,
    "final_pdf_generated_at" TIMESTAMP(3),
    "final_pdf_version" DOUBLE PRECISION,
    "approval_history" JSONB,
    "snap_org_name" TEXT,
    "snap_org_street" TEXT,
    "snap_org_zip" TEXT,
    "snap_org_city" TEXT,
    "snap_org_phone" TEXT,
    "snap_org_email" TEXT,
    "snap_org_website" TEXT,
    "snap_org_finma" TEXT,
    "snap_adv_firstname" TEXT,
    "snap_adv_lastname" TEXT,
    "snap_adv_function" TEXT,
    "snap_adv_phone" TEXT,
    "snap_adv_email" TEXT,
    "snap_adv_finma" TEXT,
    "snap_adv_vbv" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "advisory_dossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossier_snapshot" (
    "id" TEXT NOT NULL,
    "dossier_id" TEXT NOT NULL,
    "version" DOUBLE PRECISION NOT NULL,
    "snapshot_data" TEXT,
    "pdf_url" TEXT,
    "created_by_name" TEXT,
    "notes" TEXT,
    "customer_id" TEXT,
    "organization_id" TEXT,
    "advisor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "dossier_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutation_request" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "policy_number" TEXT,
    "request_type" "mutation_request_type" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "mutation_request_status" NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "new_policy_id" TEXT,
    "notes" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "mutation_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_suggestion" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "policy_number" TEXT,
    "customer_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "insurer" TEXT,
    "product" TEXT,
    "premium_current" DOUBLE PRECISION NOT NULL,
    "premium_benchmark" DOUBLE PRECISION NOT NULL,
    "premium_suggested" DOUBLE PRECISION,
    "saving_amount" DOUBLE PRECISION,
    "saving_percent" DOUBLE PRECISION,
    "priority" "pricing_suggestion_priority" NOT NULL DEFAULT 'low',
    "status" "pricing_suggestion_status" NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_date" TIMESTAMP(3),
    "implemented_date" TIMESTAMP(3),
    "reason" TEXT,
    "renewal_opportunity" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "organization_id" TEXT,
    "advisor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "pricing_suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "email_campaign_status" NOT NULL DEFAULT 'draft',
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "filter_status" "email_campaign_filter_status" NOT NULL DEFAULT 'all',
    "filter_canton" TEXT,
    "recipients_count" DOUBLE PRECISION,
    "sent_count" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "failed_count" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "email_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "email_template_category" NOT NULL DEFAULT 'general',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "email_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaction" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "type" "interaction_type" NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "date" TIMESTAMP(3),
    "request_status" "interaction_request_status" NOT NULL DEFAULT 'offen',
    "is_customer_request" BOOLEAN NOT NULL DEFAULT false,
    "organization_id" TEXT,
    "advisor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_knowledge_pattern" (
    "id" TEXT NOT NULL,
    "insurer" TEXT NOT NULL,
    "document_type" TEXT,
    "pattern_type" "pattern_type" NOT NULL,
    "signal" TEXT NOT NULL,
    "maps_to" TEXT NOT NULL,
    "maps_to_value" TEXT,
    "confidence_boost" DOUBLE PRECISION,
    "correction_count" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "first_seen_date" TIMESTAMP(3),
    "last_confirmed_date" TIMESTAMP(3),
    "description" TEXT,
    "example" TEXT,
    "source_correction_ids" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "validated_by_admin" BOOLEAN NOT NULL DEFAULT false,
    "admin_notes" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "insurance_knowledge_pattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_improvement" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT,
    "title" TEXT NOT NULL,
    "priority" "enterprise_improvement_priority" NOT NULL,
    "area" "enterprise_improvement_area" NOT NULL,
    "current_state" TEXT NOT NULL,
    "target_state" TEXT NOT NULL,
    "ki_recommendation" TEXT,
    "implementation_steps" TEXT[],
    "estimated_impact" JSONB,
    "affected_entities" TEXT[],
    "affected_pages" TEXT[],
    "success_metrics" JSONB,
    "risks" TEXT[],
    "rollback_plan" TEXT,
    "status" "enterprise_improvement_status" NOT NULL DEFAULT 'proposed',
    "proposed_by" TEXT,
    "proposed_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "implemented_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "actual_impact" JSONB,
    "rejection_reason" TEXT,
    "notes" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "enterprise_improvement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_incident" (
    "id" TEXT NOT NULL,
    "priority" "enterprise_incident_priority" NOT NULL DEFAULT 'medium',
    "severity" "enterprise_incident_severity" NOT NULL DEFAULT 'warning',
    "category" "enterprise_incident_category" NOT NULL,
    "module" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "organization_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "root_cause" TEXT,
    "technical_details" TEXT,
    "recommended_action" TEXT,
    "auto_fix_possible" BOOLEAN NOT NULL DEFAULT false,
    "auto_fix_action" TEXT,
    "manual_review_required" BOOLEAN NOT NULL DEFAULT true,
    "governance_block" BOOLEAN NOT NULL DEFAULT false,
    "status" "enterprise_incident_status" NOT NULL DEFAULT 'open',
    "root_cause_cluster" "root_cause_cluster" NOT NULL DEFAULT 'none',
    "impact_governance" DOUBLE PRECISION,
    "impact_financial" DOUBLE PRECISION,
    "impact_compliance" DOUBLE PRECISION,
    "impact_operational" DOUBLE PRECISION,
    "impact_reputation" DOUBLE PRECISION,
    "strategic_impact_score" DOUBLE PRECISION,
    "assigned_to" TEXT,
    "resolution_notes" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "detected_by" TEXT,
    "detected_at" TIMESTAMP(3),
    "sla_due_at" TIMESTAMP(3),
    "sla_status" "sla_status" NOT NULL DEFAULT 'ok',
    "sla_escalated" BOOLEAN NOT NULL DEFAULT false,
    "sla_escalated_at" TIMESTAMP(3),
    "affected_entities" JSONB,
    "incident_audit_log" JSONB,
    "validation_run_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "enterprise_incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_rule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rule_version" TEXT NOT NULL DEFAULT '1.0',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "entity_type" TEXT NOT NULL,
    "event_types" "governance_event_type"[],
    "layer" "governance_rule_layer" NOT NULL,
    "business_criticality" "governance_business_criticality" NOT NULL DEFAULT 'MEDIUM',
    "enforcement_mode" "governance_enforcement_mode" NOT NULL DEFAULT 'monitor',
    "simulate_only" BOOLEAN NOT NULL DEFAULT true,
    "condition_json" JSONB,
    "custom_validator_function_name" TEXT,
    "error_message" TEXT NOT NULL,
    "resolution_guidance" TEXT,
    "rule_status" "governance_rule_status" NOT NULL DEFAULT 'draft',
    "rule_scope" "governance_rule_scope" NOT NULL DEFAULT 'GLOBAL',
    "created_by" TEXT,
    "created_by_email" TEXT,
    "updated_by" TEXT,
    "updated_by_email" TEXT,
    "last_execution_at" TIMESTAMP(3),
    "last_execution_ms" DOUBLE PRECISION,
    "execution_count" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "violation_count" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "simulate_count" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeout_ms" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "notes" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "governance_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_score_snapshot" (
    "id" TEXT NOT NULL,
    "snapshot_date" TIMESTAMP(3),
    "overall" DOUBLE PRECISION NOT NULL,
    "risk_level" "governance_risk_level",
    "domains" JSONB,
    "alerts" JSONB,
    "weights" JSONB,
    "computed_at" TIMESTAMP(3) NOT NULL,
    "computed_by" TEXT,
    "previous_overall" DOUBLE PRECISION,
    "trend" "governance_trend",
    "trend_delta" DOUBLE PRECISION,
    "organization_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "governance_score_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duplicate_alert" (
    "id" TEXT NOT NULL,
    "entity_type" "duplicate_alert_entity_type" NOT NULL,
    "primary_entity_id" TEXT NOT NULL,
    "duplicate_entity_id" TEXT NOT NULL,
    "match_criteria" "duplicate_match_criteria"[],
    "confidence_score" DOUBLE PRECISION,
    "detected_at" TIMESTAMP(3) NOT NULL,
    "detected_by" TEXT,
    "status" "duplicate_alert_status" NOT NULL DEFAULT 'new',
    "action_taken" TEXT,
    "resolved_at" TIMESTAMP(3),
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "duplicate_alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_log" (
    "id" TEXT NOT NULL,
    "backup_id" TEXT,
    "backup_type" "backup_type" NOT NULL,
    "status" "backup_status" NOT NULL DEFAULT 'completed',
    "timestamp" TIMESTAMP(3) NOT NULL,
    "error_message" TEXT,
    "total_records" DOUBLE PRECISION,
    "total_changes" DOUBLE PRECISION,
    "checksum" TEXT,
    "retention_days" DOUBLE PRECISION,
    "created_by" TEXT,
    "week_number" DOUBLE PRECISION,
    "compliance_tags" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "backup_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_log" (
    "id" TEXT NOT NULL,
    "error_type" "error_type" NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "error_message" TEXT NOT NULL,
    "stack_trace" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "user_email" TEXT,
    "function_name" TEXT,
    "status" "error_log_status" NOT NULL DEFAULT 'new',
    "resolution_notes" TEXT,
    "resolved_at" TIMESTAMP(3),
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "error_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extraction_correction_log" (
    "id" TEXT NOT NULL,
    "insurer" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_name" TEXT,
    "file_url" TEXT,
    "original_extraction" JSONB,
    "corrected_values" JSONB,
    "field_corrections" JSONB,
    "error_categories" TEXT[],
    "correction_count" DOUBLE PRECISION,
    "ai_analysis" TEXT,
    "patterns_extracted" JSONB,
    "corrected_by_user_id" TEXT,
    "corrected_by_email" TEXT,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "review_notes" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "extraction_correction_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdf_export_log" (
    "id" TEXT NOT NULL,
    "dossier_id" TEXT NOT NULL,
    "dossier_title" TEXT,
    "dossier_version" DOUBLE PRECISION,
    "pdf_version" DOUBLE PRECISION,
    "pdf_hash" TEXT NOT NULL,
    "file_uri" TEXT,
    "filename" TEXT,
    "generated_by_id" TEXT,
    "generated_by_name" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "snapshot_id" TEXT,
    "customer_name" TEXT,
    "exported_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "session_id" TEXT,
    "immutable" BOOLEAN NOT NULL DEFAULT true,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "pdf_export_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_queue" (
    "id" TEXT NOT NULL,
    "job_type" "automation_job_type" NOT NULL,
    "status" "automation_job_status" NOT NULL DEFAULT 'pending',
    "related_document_id" TEXT,
    "related_entity_type" TEXT,
    "related_entity_id" TEXT,
    "payload" TEXT,
    "result" TEXT,
    "error_message" TEXT,
    "retry_count" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "automation_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_finding" (
    "id" TEXT NOT NULL,
    "review_id" TEXT,
    "organization_id" TEXT NOT NULL,
    "finding_type" "ai_finding_type" NOT NULL,
    "severity" "finding_severity" NOT NULL DEFAULT 'warning',
    "confidence_score" DOUBLE PRECISION,
    "evidence_strength" "evidence_strength",
    "governance_risk_score" DOUBLE PRECISION,
    "false_positive_risk" "false_positive_risk" NOT NULL DEFAULT 'low',
    "explanation" JSONB,
    "evidence" JSONB,
    "explainability" JSONB,
    "audit" JSONB,
    "status" "finding_status" NOT NULL DEFAULT 'new',
    "linked_incident_id" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "title" TEXT,
    "description" TEXT,
    "suggested_action" TEXT,
    "detected_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "ai_finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_review" (
    "id" TEXT NOT NULL,
    "level" "ai_review_level" NOT NULL,
    "status" "ai_review_status" NOT NULL DEFAULT 'completed',
    "findings" JSONB NOT NULL,
    "finding_count" DOUBLE PRECISION,
    "critical_count" DOUBLE PRECISION,
    "warning_count" DOUBLE PRECISION,
    "opportunity_count" DOUBLE PRECISION,
    "reviewed_at" TIMESTAMP(3) NOT NULL,
    "reviewed_by" TEXT NOT NULL,
    "previous_review_id" TEXT,
    "notes" TEXT,
    "organization_id" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "input_data" JSONB,
    "output_data" JSONB,
    "confidence" DOUBLE PRECISION,
    "model_version" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "ai_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_advisor" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "contract_policy_number" TEXT,
    "advisor_id" TEXT NOT NULL,
    "advisor_name" TEXT,
    "advisor_email" TEXT,
    "role" "contract_advisor_role" NOT NULL DEFAULT 'primary',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "specialization" TEXT,
    "notes" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "contract_advisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_advisor" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "advisor_id" TEXT NOT NULL,
    "advisor_name" TEXT,
    "advisor_email" TEXT,
    "role" "customer_advisor_role" NOT NULL DEFAULT 'primary',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by" TEXT,

    CONSTRAINT "customer_advisor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_organization_id_idx" ON "user"("organization_id");

-- CreateIndex
CREATE INDEX "user_organization_id_email_idx" ON "user"("organization_id", "email");

-- CreateIndex
CREATE INDEX "user_organization_id_role_idx" ON "user"("organization_id", "role");

-- CreateIndex
CREATE INDEX "refresh_token_user_id_idx" ON "refresh_token"("user_id");

-- CreateIndex
CREATE INDEX "refresh_token_token_hash_idx" ON "refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX "advisor_organization_id_idx" ON "advisor"("organization_id");

-- CreateIndex
CREATE INDEX "customer_organization_id_status_idx" ON "customer"("organization_id", "status");

-- CreateIndex
CREATE INDEX "customer_organization_id_advisor_id_idx" ON "customer"("organization_id", "advisor_id");

-- CreateIndex
CREATE INDEX "customer_organization_id_archived_idx" ON "customer"("organization_id", "archived");

-- CreateIndex
CREATE INDEX "customer_organization_id_primary_advisor_id_idx" ON "customer"("organization_id", "primary_advisor_id");

-- CreateIndex
CREATE INDEX "customer_organization_id_last_name_idx" ON "customer"("organization_id", "last_name");

-- CreateIndex
CREATE INDEX "customer_organization_id_email_idx" ON "customer"("organization_id", "email");

-- CreateIndex
CREATE INDEX "customer_organization_id_first_name_last_name_idx" ON "customer"("organization_id", "first_name", "last_name");

-- CreateIndex
CREATE INDEX "contract_organization_id_status_idx" ON "contract"("organization_id", "status");

-- CreateIndex
CREATE INDEX "contract_organization_id_customer_id_idx" ON "contract"("organization_id", "customer_id");

-- CreateIndex
CREATE INDEX "contract_organization_id_advisor_id_idx" ON "contract"("organization_id", "advisor_id");

-- CreateIndex
CREATE INDEX "contract_organization_id_renewal_status_idx" ON "contract"("organization_id", "renewal_status");

-- CreateIndex
CREATE INDEX "contract_organization_id_renewal_date_idx" ON "contract"("organization_id", "renewal_date");

-- CreateIndex
CREATE INDEX "contract_organization_id_policy_number_idx" ON "contract"("organization_id", "policy_number");

-- CreateIndex
CREATE INDEX "application_organization_id_status_idx" ON "application"("organization_id", "status");

-- CreateIndex
CREATE INDEX "application_organization_id_advisor_id_idx" ON "application"("organization_id", "advisor_id");

-- CreateIndex
CREATE INDEX "application_organization_id_insurer_idx" ON "application"("organization_id", "insurer");

-- CreateIndex
CREATE INDEX "application_organization_id_policy_number_idx" ON "application"("organization_id", "policy_number");

-- CreateIndex
CREATE INDEX "commission_organization_id_contract_id_idx" ON "commission"("organization_id", "contract_id");

-- CreateIndex
CREATE INDEX "commission_organization_id_advisor_id_idx" ON "commission"("organization_id", "advisor_id");

-- CreateIndex
CREATE INDEX "commission_entry_organization_id_advisor_id_idx" ON "commission_entry"("organization_id", "advisor_id");

-- CreateIndex
CREATE INDEX "commission_entry_organization_id_policy_id_idx" ON "commission_entry"("organization_id", "policy_id");

-- CreateIndex
CREATE INDEX "commission_entry_organization_id_status_idx" ON "commission_entry"("organization_id", "status");

-- CreateIndex
CREATE INDEX "commission_entry_organization_id_policy_number_idx" ON "commission_entry"("organization_id", "policy_number");

-- CreateIndex
CREATE INDEX "document_organization_id_customer_id_idx" ON "document"("organization_id", "customer_id");

-- CreateIndex
CREATE INDEX "document_organization_id_category_idx" ON "document"("organization_id", "category");

-- CreateIndex
CREATE INDEX "document_organization_id_name_idx" ON "document"("organization_id", "name");

-- CreateIndex
CREATE INDEX "document_organization_id_uploaded_by_idx" ON "document"("organization_id", "uploaded_by");

-- CreateIndex
CREATE INDEX "document_organization_id_created_at_idx" ON "document"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "task_organization_id_assigned_to_status_idx" ON "task"("organization_id", "assigned_to", "status");

-- CreateIndex
CREATE INDEX "task_organization_id_due_date_idx" ON "task"("organization_id", "due_date");

-- CreateIndex
CREATE INDEX "lead_organization_id_status_idx" ON "lead"("organization_id", "status");

-- CreateIndex
CREATE INDEX "lead_organization_id_advisor_id_idx" ON "lead"("organization_id", "advisor_id");

-- CreateIndex
CREATE INDEX "audit_log_organization_id_timestamp_idx" ON "audit_log"("organization_id", "timestamp");

-- CreateIndex
CREATE INDEX "audit_log_organization_id_entity_type_entity_id_idx" ON "audit_log"("organization_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "notification_organization_id_status_idx" ON "notification"("organization_id", "status");

-- CreateIndex
CREATE INDEX "notification_organization_id_recipient_email_idx" ON "notification"("organization_id", "recipient_email");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisor" ADD CONSTRAINT "advisor_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_primary_customer_id_fkey" FOREIGN KEY ("primary_customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_primary_advisor_id_fkey" FOREIGN KEY ("primary_advisor_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_advisor_id_fkey" FOREIGN KEY ("advisor_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_primary_broker_id_fkey" FOREIGN KEY ("primary_broker_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_linked_contract_id_fkey" FOREIGN KEY ("linked_contract_id") REFERENCES "contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission" ADD CONSTRAINT "commission_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission" ADD CONSTRAINT "commission_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_entry" ADD CONSTRAINT "commission_entry_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rate" ADD CONSTRAINT "commission_rate_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_split" ADD CONSTRAINT "commission_split_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_split" ADD CONSTRAINT "commission_split_commission_entry_id_fkey" FOREIGN KEY ("commission_entry_id") REFERENCES "commission_entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_linked_contract_id_fkey" FOREIGN KEY ("linked_contract_id") REFERENCES "contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_linked_application_id_fkey" FOREIGN KEY ("linked_application_id") REFERENCES "application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "user"("email") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_log" ADD CONSTRAINT "system_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_definition" ADD CONSTRAINT "status_definition_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bag_praemien_daten" ADD CONSTRAINT "bag_praemien_daten_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "krankenkassen_vergleich" ADD CONSTRAINT "krankenkassen_vergleich_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "krankenkassen_vergleich" ADD CONSTRAINT "krankenkassen_vergleich_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vergleichs_analyse" ADD CONSTRAINT "vergleichs_analyse_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vergleichs_analyse" ADD CONSTRAINT "vergleichs_analyse_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entry" ADD CONSTRAINT "accounting_entry_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entry" ADD CONSTRAINT "accounting_entry_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_entry" ADD CONSTRAINT "accounting_entry_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout" ADD CONSTRAINT "payout_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_period" ADD CONSTRAINT "finance_period_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storno_config" ADD CONSTRAINT "storno_config_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ausschreibung" ADD CONSTRAINT "ausschreibung_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ausschreibung" ADD CONSTRAINT "ausschreibung_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offerte" ADD CONSTRAINT "offerte_ausschreibung_id_fkey" FOREIGN KEY ("ausschreibung_id") REFERENCES "ausschreibung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offerte" ADD CONSTRAINT "offerte_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versicherer_db" ADD CONSTRAINT "versicherer_db_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner" ADD CONSTRAINT "partner_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_activity" ADD CONSTRAINT "partner_activity_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_activity" ADD CONSTRAINT "partner_activity_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_document" ADD CONSTRAINT "partner_document_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_document" ADD CONSTRAINT "partner_document_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim" ADD CONSTRAINT "claim_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim" ADD CONSTRAINT "claim_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim" ADD CONSTRAINT "claim_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal" ADD CONSTRAINT "deal_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal" ADD CONSTRAINT "deal_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verkaufschance" ADD CONSTRAINT "verkaufschance_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verkaufschance" ADD CONSTRAINT "verkaufschance_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisory_dossier" ADD CONSTRAINT "advisory_dossier_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisory_dossier" ADD CONSTRAINT "advisory_dossier_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_snapshot" ADD CONSTRAINT "dossier_snapshot_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "advisory_dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_snapshot" ADD CONSTRAINT "dossier_snapshot_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_snapshot" ADD CONSTRAINT "dossier_snapshot_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutation_request" ADD CONSTRAINT "mutation_request_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutation_request" ADD CONSTRAINT "mutation_request_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutation_request" ADD CONSTRAINT "mutation_request_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_suggestion" ADD CONSTRAINT "pricing_suggestion_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_suggestion" ADD CONSTRAINT "pricing_suggestion_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_suggestion" ADD CONSTRAINT "pricing_suggestion_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaign" ADD CONSTRAINT "email_campaign_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_template" ADD CONSTRAINT "email_template_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction" ADD CONSTRAINT "interaction_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction" ADD CONSTRAINT "interaction_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_knowledge_pattern" ADD CONSTRAINT "insurance_knowledge_pattern_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_improvement" ADD CONSTRAINT "enterprise_improvement_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_incident" ADD CONSTRAINT "enterprise_incident_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governance_rule" ADD CONSTRAINT "governance_rule_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governance_score_snapshot" ADD CONSTRAINT "governance_score_snapshot_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_alert" ADD CONSTRAINT "duplicate_alert_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_log" ADD CONSTRAINT "backup_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_log" ADD CONSTRAINT "error_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extraction_correction_log" ADD CONSTRAINT "extraction_correction_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdf_export_log" ADD CONSTRAINT "pdf_export_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_queue" ADD CONSTRAINT "automation_queue_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_finding" ADD CONSTRAINT "ai_finding_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_review" ADD CONSTRAINT "ai_review_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_advisor" ADD CONSTRAINT "contract_advisor_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_advisor" ADD CONSTRAINT "contract_advisor_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_advisor" ADD CONSTRAINT "customer_advisor_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_advisor" ADD CONSTRAINT "customer_advisor_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

