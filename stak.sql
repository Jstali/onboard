--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Homebrew)
-- Dumped by pg_dump version 17.5

-- Started on 2025-09-08 12:43:38 IST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 4284 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 281 (class 1255 OID 33022)
-- Name: delete_employee_completely(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_employee_completely(employee_email character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
      DECLARE
        user_id INTEGER;
        deletion_success BOOLEAN := TRUE;
      BEGIN
        -- Get user ID from email
        SELECT id INTO user_id FROM users WHERE email = employee_email;
        
        IF user_id IS NULL THEN
          RAISE NOTICE 'User with email % not found', employee_email;
          RETURN FALSE;
        END IF;
        
        -- Delete from all related tables
        BEGIN
          DELETE FROM document_collection WHERE employee_id = user_id;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error deleting from document_collection: %', SQLERRM;
          deletion_success := FALSE;
        END;
        
        BEGIN
          DELETE FROM employee_forms WHERE employee_id = user_id;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error deleting from employee_forms: %', SQLERRM;
          deletion_success := FALSE;
        END;
        
        BEGIN
          DELETE FROM attendance WHERE employee_id = user_id;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error deleting from attendance: %', SQLERRM;
          deletion_success := FALSE;
        END;
        
        BEGIN
          DELETE FROM leave_requests WHERE employee_id = user_id;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error deleting from leave_requests: %', SQLERRM;
          deletion_success := FALSE;
        END;
        
        BEGIN
          DELETE FROM onboarded_employees WHERE user_id = user_id;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error deleting from onboarded_employees: %', SQLERRM;
          deletion_success := FALSE;
        END;
        
        BEGIN
          DELETE FROM leave_balances WHERE employee_id = user_id;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error deleting from leave_balances: %', SQLERRM;
          deletion_success := FALSE;
        END;
        
        BEGIN
          DELETE FROM employee_documents WHERE employee_id = user_id;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error deleting from employee_documents: %', SQLERRM;
          deletion_success := FALSE;
        END;
        
        BEGIN
          DELETE FROM managers WHERE manager_id = user_id;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error deleting from managers: %', SQLERRM;
          deletion_success := FALSE;
        END;
        
        -- Finally delete the user
        BEGIN
          DELETE FROM users WHERE id = user_id;
          RAISE NOTICE 'Successfully deleted user with email: %', employee_email;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error deleting from users: %', SQLERRM;
          deletion_success := FALSE;
        END;
        
        RETURN deletion_success;
      END;
      $$;


ALTER FUNCTION public.delete_employee_completely(employee_email character varying) OWNER TO postgres;

--
-- TOC entry 295 (class 1255 OID 33755)
-- Name: get_attendance_stats(integer, date, date); Type: FUNCTION; Schema: public; Owner: stalin_j
--

CREATE FUNCTION public.get_attendance_stats(p_employee_id integer, p_start_date date, p_end_date date) RETURNS TABLE(total_days integer, present_days integer, wfh_days integer, leave_days integer, absent_days integer, half_day_days integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_days,
        COUNT(CASE WHEN status = 'present' THEN 1 END)::INTEGER as present_days,
        COUNT(CASE WHEN status = 'wfh' THEN 1 END)::INTEGER as wfh_days,
        COUNT(CASE WHEN status = 'leave' THEN 1 END)::INTEGER as leave_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END)::INTEGER as absent_days,
        COUNT(CASE WHEN status = 'half_day' THEN 1 END)::INTEGER as half_day_days
    FROM attendance 
    WHERE employee_id = p_employee_id 
        AND date BETWEEN p_start_date AND p_end_date;
END;
$$;


ALTER FUNCTION public.get_attendance_stats(p_employee_id integer, p_start_date date, p_end_date date) OWNER TO stalin_j;

--
-- TOC entry 4285 (class 0 OID 0)
-- Dependencies: 295
-- Name: FUNCTION get_attendance_stats(p_employee_id integer, p_start_date date, p_end_date date); Type: COMMENT; Schema: public; Owner: stalin_j
--

COMMENT ON FUNCTION public.get_attendance_stats(p_employee_id integer, p_start_date date, p_end_date date) IS 'Get attendance statistics for an employee within a date range';


--
-- TOC entry 283 (class 1255 OID 33845)
-- Name: manually_add_employee(character varying, character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.manually_add_employee(p_email character varying, p_first_name character varying, p_last_name character varying, p_role character varying, p_employment_type character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $_$
DECLARE
    user_id INTEGER;
    employee_id_val VARCHAR;
BEGIN
    -- Insert into users table
    INSERT INTO users (email, first_name, last_name, role, password)
    VALUES (p_email, p_first_name, p_last_name, p_role, '$2b$10$defaulthash')
    RETURNING id INTO user_id;
    
    -- Generate employee ID
    employee_id_val := 'EMP' || LPAD(user_id::TEXT, 6, '0');
    
    -- Insert into employee_forms table with employment type
    INSERT INTO employee_forms (employee_id, type, status)
    VALUES (user_id, p_employment_type, 'pending');
    
    RETURN user_id;
END;
$_$;


ALTER FUNCTION public.manually_add_employee(p_email character varying, p_first_name character varying, p_last_name character varying, p_role character varying, p_employment_type character varying) OWNER TO postgres;

--
-- TOC entry 4286 (class 0 OID 0)
-- Dependencies: 283
-- Name: FUNCTION manually_add_employee(p_email character varying, p_first_name character varying, p_last_name character varying, p_role character varying, p_employment_type character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.manually_add_employee(p_email character varying, p_first_name character varying, p_last_name character varying, p_role character varying, p_employment_type character varying) IS 'Manually add an employee with specified employment type';


--
-- TOC entry 282 (class 1255 OID 33023)
-- Name: trigger_delete_employee_data(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_delete_employee_data() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Clean up related data when employee is deleted from master
  DELETE FROM attendance WHERE employee_id IN (
    SELECT id FROM users WHERE email = OLD.company_email
  );
  DELETE FROM leave_requests WHERE employee_id IN (
    SELECT id FROM users WHERE email = OLD.company_email
  );
  DELETE FROM expense_requests WHERE employee_id IN (
    SELECT id FROM users WHERE email = OLD.company_email
  );
  
  RETURN OLD;
END;
$$;


ALTER FUNCTION public.trigger_delete_employee_data() OWNER TO postgres;

--
-- TOC entry 296 (class 1255 OID 32917)
-- Name: update_document_collection_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_document_collection_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Update document_collection status when employee_documents are inserted/updated
  UPDATE document_collection
  SET 
    status = 'Received',
    updated_at = CURRENT_TIMESTAMP
  WHERE employee_id = NEW.employee_id
  AND (
    (NEW.document_type = 'resume' AND document_name LIKE '%Resume%')
    OR (NEW.document_type = 'offer_letter' AND document_name LIKE '%Offer%')
    OR (NEW.document_type = 'compensation_letter' AND document_name LIKE '%Compensation%')
    OR (NEW.document_type = 'experience_letter' AND document_name LIKE '%Experience%')
    OR (NEW.document_type = 'payslip' AND document_name LIKE '%Pay%')
    OR (NEW.document_type = 'form16' AND document_name LIKE '%Form 16%')
    OR (NEW.document_type = 'ssc_certificate' AND document_name LIKE '%SSC%Certificate%')
    OR (NEW.document_type = 'ssc_marksheet' AND document_name LIKE '%SSC%Marksheet%')
    OR (NEW.document_type = 'hsc_certificate' AND document_name LIKE '%HSC%Certificate%')
    OR (NEW.document_type = 'hsc_marksheet' AND document_name LIKE '%HSC%Marksheet%')
    OR (NEW.document_type = 'graduation_marksheet' AND document_name LIKE '%Graduation%Marksheet%')
    OR (NEW.document_type = 'graduation_certificate' AND (document_name LIKE '%Graduation%Certificate%' OR document_name = 'Latest Graduation'))
    OR (NEW.document_type = 'postgrad_marksheet' AND document_name LIKE '%Post-Graduation%Marksheet%')
    OR (NEW.document_type = 'postgrad_certificate' AND document_name LIKE '%Post-Graduation%Certificate%')
    OR (NEW.document_type = 'aadhaar' AND document_name LIKE '%Aadhaar%')
    OR (NEW.document_type = 'pan' AND document_name LIKE '%PAN%')
    OR (NEW.document_type = 'passport' AND document_name LIKE '%Passport%')
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_document_collection_status() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 24671)
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    employee_id integer,
    date date NOT NULL,
    status character varying(50) NOT NULL,
    reason text,
    clock_in_time time without time zone,
    clock_out_time time without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hours integer,
    CONSTRAINT attendance_status_check CHECK (((status)::text = ANY ((ARRAY['present'::character varying, 'absent'::character varying, 'Work From Home'::character varying, 'leave'::character varying, 'Half Day'::character varying, 'holiday'::character varying])::text[])))
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- TOC entry 4287 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE attendance; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.attendance IS 'Daily attendance records for employees';


--
-- TOC entry 227 (class 1259 OID 24670)
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO postgres;

--
-- TOC entry 4288 (class 0 OID 0)
-- Dependencies: 227
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- TOC entry 261 (class 1259 OID 33058)
-- Name: attendance_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_settings (
    id integer NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value text,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.attendance_settings OWNER TO postgres;

--
-- TOC entry 4289 (class 0 OID 0)
-- Dependencies: 261
-- Name: TABLE attendance_settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.attendance_settings IS 'Configuration settings for attendance system';


--
-- TOC entry 260 (class 1259 OID 33057)
-- Name: attendance_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_settings_id_seq OWNER TO postgres;

--
-- TOC entry 4290 (class 0 OID 0)
-- Dependencies: 260
-- Name: attendance_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_settings_id_seq OWNED BY public.attendance_settings.id;


--
-- TOC entry 243 (class 1259 OID 24845)
-- Name: comp_off_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comp_off_balances (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    year integer NOT NULL,
    total_earned numeric(5,1) DEFAULT 0,
    comp_off_taken numeric(5,1) DEFAULT 0,
    comp_off_remaining numeric(5,1) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.comp_off_balances OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 24844)
-- Name: comp_off_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comp_off_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comp_off_balances_id_seq OWNER TO postgres;

--
-- TOC entry 4291 (class 0 OID 0)
-- Dependencies: 242
-- Name: comp_off_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comp_off_balances_id_seq OWNED BY public.comp_off_balances.id;


--
-- TOC entry 245 (class 1259 OID 24868)
-- Name: company_emails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_emails (
    id integer NOT NULL,
    user_id integer,
    manager_id character varying(100),
    company_email character varying(255) NOT NULL,
    is_primary boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_user_or_manager CHECK ((((user_id IS NOT NULL) AND (manager_id IS NULL)) OR ((user_id IS NULL) AND (manager_id IS NOT NULL))))
);


ALTER TABLE public.company_emails OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 24867)
-- Name: company_emails_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_emails_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_emails_id_seq OWNER TO postgres;

--
-- TOC entry 4292 (class 0 OID 0)
-- Dependencies: 244
-- Name: company_emails_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_emails_id_seq OWNED BY public.company_emails.id;


--
-- TOC entry 267 (class 1259 OID 33105)
-- Name: contract_employees; Type: TABLE; Schema: public; Owner: stalin_j
--

CREATE TABLE public.contract_employees (
    id integer NOT NULL,
    employee_id character varying(100) NOT NULL,
    employee_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    department character varying(100),
    designation character varying(100),
    contract_start_date date,
    contract_end_date date,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.contract_employees OWNER TO stalin_j;

--
-- TOC entry 4293 (class 0 OID 0)
-- Dependencies: 267
-- Name: TABLE contract_employees; Type: COMMENT; Schema: public; Owner: stalin_j
--

COMMENT ON TABLE public.contract_employees IS 'Table to store contract employees';


--
-- TOC entry 266 (class 1259 OID 33104)
-- Name: contract_employees_id_seq; Type: SEQUENCE; Schema: public; Owner: stalin_j
--

CREATE SEQUENCE public.contract_employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contract_employees_id_seq OWNER TO stalin_j;

--
-- TOC entry 4294 (class 0 OID 0)
-- Dependencies: 266
-- Name: contract_employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stalin_j
--

ALTER SEQUENCE public.contract_employees_id_seq OWNED BY public.contract_employees.id;


--
-- TOC entry 239 (class 1259 OID 24794)
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(20) NOT NULL,
    description text,
    manager_id integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- TOC entry 4295 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE departments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.departments IS 'Company departments and organizational structure';


--
-- TOC entry 238 (class 1259 OID 24793)
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- TOC entry 4296 (class 0 OID 0)
-- Dependencies: 238
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- TOC entry 251 (class 1259 OID 32846)
-- Name: document_collection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_collection (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    employee_name character varying(255) NOT NULL,
    emp_id character varying(100) NOT NULL,
    department character varying(100),
    join_date date NOT NULL,
    due_date date NOT NULL,
    document_name character varying(255) NOT NULL,
    document_type character varying(50) DEFAULT 'Required'::character varying NOT NULL,
    status character varying(50) DEFAULT 'Pending'::character varying,
    notes text,
    uploaded_file_url character varying(500),
    uploaded_file_name character varying(255),
    uploaded_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.document_collection OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 32845)
-- Name: document_collection_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_collection_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_collection_id_seq OWNER TO postgres;

--
-- TOC entry 4297 (class 0 OID 0)
-- Dependencies: 250
-- Name: document_collection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_collection_id_seq OWNED BY public.document_collection.id;


--
-- TOC entry 253 (class 1259 OID 32864)
-- Name: document_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_templates (
    id integer NOT NULL,
    document_name character varying(255) NOT NULL,
    document_type character varying(50) DEFAULT 'Required'::character varying NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    category character varying(50),
    is_required boolean DEFAULT false,
    allow_multiple boolean DEFAULT false
);


ALTER TABLE public.document_templates OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 32863)
-- Name: document_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_templates_id_seq OWNER TO postgres;

--
-- TOC entry 4298 (class 0 OID 0)
-- Dependencies: 252
-- Name: document_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_templates_id_seq OWNED BY public.document_templates.id;


--
-- TOC entry 277 (class 1259 OID 33800)
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    employee_id integer,
    document_type character varying(100) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    mime_type character varying(100),
    status character varying(50) DEFAULT 'pending'::character varying,
    uploaded_by integer,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    review_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT documents_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 4299 (class 0 OID 0)
-- Dependencies: 277
-- Name: TABLE documents; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.documents IS 'Employee document uploads and management';


--
-- TOC entry 276 (class 1259 OID 33799)
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- TOC entry 4300 (class 0 OID 0)
-- Dependencies: 276
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- TOC entry 224 (class 1259 OID 24639)
-- Name: employee_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_master (
    id integer NOT NULL,
    employee_id character varying(100) NOT NULL,
    employee_name character varying(255) NOT NULL,
    company_email character varying(255) NOT NULL,
    manager_id character varying(100),
    manager_name character varying(100),
    type character varying(50) NOT NULL,
    role character varying(100),
    doj date NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying,
    department character varying(100),
    designation character varying(100),
    salary_band character varying(50),
    location character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    department_id integer,
    manager2_id character varying(100),
    manager2_name character varying(100),
    manager3_id character varying(100),
    manager3_name character varying(100)
);


ALTER TABLE public.employee_master OWNER TO postgres;

--
-- TOC entry 4301 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE employee_master; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.employee_master IS 'Final approved employee records';


--
-- TOC entry 218 (class 1259 OID 24578)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'employee'::character varying NOT NULL,
    temp_password character varying(255),
    first_name character varying(100),
    last_name character varying(100),
    phone character varying(20),
    address text,
    emergency_contact_name character varying(100),
    emergency_contact_phone character varying(20),
    emergency_contact_relationship character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    emergency_contact_name2 character varying(100),
    emergency_contact_phone2 character varying(20),
    emergency_contact_relationship2 character varying(50),
    is_first_login boolean DEFAULT true
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4302 (class 0 OID 0)
-- Dependencies: 218
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'Core user authentication and profile information';


--
-- TOC entry 278 (class 1259 OID 33836)
-- Name: employee_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.employee_details AS
 SELECT u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    em.employee_id,
    em.company_email,
    em.department,
    em.designation,
    em.manager_name,
    em.status,
    em.doj,
    em.type AS employment_type
   FROM (public.users u
     LEFT JOIN public.employee_master em ON (((u.email)::text = (em.company_email)::text)))
  WHERE ((u.role)::text = ANY ((ARRAY['employee'::character varying, 'manager'::character varying])::text[]));


ALTER VIEW public.employee_details OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 24825)
-- Name: employee_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_documents (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    document_type character varying(100) NOT NULL,
    document_category character varying(50) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_url character varying(500) NOT NULL,
    file_size integer,
    mime_type character varying(100),
    is_required boolean DEFAULT false,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_documents OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 24824)
-- Name: employee_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_documents_id_seq OWNER TO postgres;

--
-- TOC entry 4303 (class 0 OID 0)
-- Dependencies: 240
-- Name: employee_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_documents_id_seq OWNED BY public.employee_documents.id;


--
-- TOC entry 220 (class 1259 OID 24592)
-- Name: employee_forms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_forms (
    id integer NOT NULL,
    employee_id integer,
    type character varying(50),
    form_data jsonb,
    files text[],
    status character varying(50) DEFAULT 'draft'::character varying,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    review_notes text,
    assigned_manager character varying(100),
    manager2_name character varying(100),
    manager3_name character varying(100),
    draft_data jsonb,
    documents_uploaded jsonb
);


ALTER TABLE public.employee_forms OWNER TO postgres;

--
-- TOC entry 4304 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE employee_forms; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.employee_forms IS 'Employee onboarding forms and document submissions';


--
-- TOC entry 219 (class 1259 OID 24591)
-- Name: employee_forms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_forms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_forms_id_seq OWNER TO postgres;

--
-- TOC entry 4305 (class 0 OID 0)
-- Dependencies: 219
-- Name: employee_forms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_forms_id_seq OWNED BY public.employee_forms.id;


--
-- TOC entry 223 (class 1259 OID 24638)
-- Name: employee_master_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_master_id_seq OWNER TO postgres;

--
-- TOC entry 4306 (class 0 OID 0)
-- Dependencies: 223
-- Name: employee_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_master_id_seq OWNED BY public.employee_master.id;


--
-- TOC entry 271 (class 1259 OID 33719)
-- Name: employee_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_notifications (
    id integer NOT NULL,
    employee_id integer,
    notification_type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_notifications OWNER TO postgres;

--
-- TOC entry 270 (class 1259 OID 33718)
-- Name: employee_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_notifications_id_seq OWNER TO postgres;

--
-- TOC entry 4307 (class 0 OID 0)
-- Dependencies: 270
-- Name: employee_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_notifications_id_seq OWNED BY public.employee_notifications.id;


--
-- TOC entry 249 (class 1259 OID 32803)
-- Name: expense_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_attachments (
    id integer NOT NULL,
    expense_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_url character varying(500) NOT NULL,
    file_size integer,
    mime_type character varying(100),
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.expense_attachments OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 32802)
-- Name: expense_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expense_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expense_attachments_id_seq OWNER TO postgres;

--
-- TOC entry 4308 (class 0 OID 0)
-- Dependencies: 248
-- Name: expense_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expense_attachments_id_seq OWNED BY public.expense_attachments.id;


--
-- TOC entry 273 (class 1259 OID 33758)
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.expense_categories OWNER TO postgres;

--
-- TOC entry 4309 (class 0 OID 0)
-- Dependencies: 273
-- Name: TABLE expense_categories; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.expense_categories IS 'Categories for expense classification';


--
-- TOC entry 272 (class 1259 OID 33757)
-- Name: expense_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expense_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expense_categories_id_seq OWNER TO postgres;

--
-- TOC entry 4310 (class 0 OID 0)
-- Dependencies: 272
-- Name: expense_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expense_categories_id_seq OWNED BY public.expense_categories.id;


--
-- TOC entry 275 (class 1259 OID 33772)
-- Name: expense_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_requests (
    id integer NOT NULL,
    employee_id integer,
    category_id integer,
    amount numeric(10,2) NOT NULL,
    description text,
    expense_date date NOT NULL,
    receipt_url text,
    status character varying(50) DEFAULT 'pending'::character varying,
    approved_by integer,
    approved_at timestamp without time zone,
    approval_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT expense_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'reimbursed'::character varying])::text[])))
);


ALTER TABLE public.expense_requests OWNER TO postgres;

--
-- TOC entry 4311 (class 0 OID 0)
-- Dependencies: 275
-- Name: TABLE expense_requests; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.expense_requests IS 'Employee expense claims and reimbursements';


--
-- TOC entry 274 (class 1259 OID 33771)
-- Name: expense_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expense_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expense_requests_id_seq OWNER TO postgres;

--
-- TOC entry 4312 (class 0 OID 0)
-- Dependencies: 274
-- Name: expense_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expense_requests_id_seq OWNED BY public.expense_requests.id;


--
-- TOC entry 247 (class 1259 OID 32769)
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    series character varying(50) NOT NULL,
    employee_id integer NOT NULL,
    employee_name character varying(255) NOT NULL,
    expense_category character varying(100) NOT NULL,
    expense_type character varying(100) NOT NULL,
    other_category character varying(255),
    amount numeric(10,2) NOT NULL,
    currency character varying(10) DEFAULT 'INR'::character varying,
    description text NOT NULL,
    attachment_url character varying(500),
    attachment_name character varying(255),
    expense_date date NOT NULL,
    project_reference character varying(255),
    payment_mode character varying(50),
    tax_included boolean DEFAULT false,
    total_reimbursable numeric(10,2),
    status character varying(50) DEFAULT 'pending_manager_approval'::character varying,
    manager1_id character varying(100),
    manager1_name character varying(100),
    manager1_status character varying(50) DEFAULT 'Pending'::character varying,
    manager1_approved_at timestamp without time zone,
    manager1_approval_notes text,
    manager2_id character varying(100),
    manager2_name character varying(100),
    manager2_status character varying(50) DEFAULT 'Pending'::character varying,
    manager2_approved_at timestamp without time zone,
    manager2_approval_notes text,
    manager3_id character varying(100),
    manager3_name character varying(100),
    manager3_status character varying(50) DEFAULT 'Pending'::character varying,
    manager3_approved_at timestamp without time zone,
    manager3_approval_notes text,
    hr_id integer,
    hr_name character varying(255),
    hr_approved_at timestamp without time zone,
    hr_approval_notes text,
    approval_token character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    client_code character varying(100)
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 32768)
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expenses_id_seq OWNER TO postgres;

--
-- TOC entry 4313 (class 0 OID 0)
-- Dependencies: 246
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- TOC entry 265 (class 1259 OID 33089)
-- Name: full_time_employees; Type: TABLE; Schema: public; Owner: stalin_j
--

CREATE TABLE public.full_time_employees (
    id integer NOT NULL,
    employee_id character varying(100) NOT NULL,
    employee_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    department character varying(100),
    designation character varying(100),
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.full_time_employees OWNER TO stalin_j;

--
-- TOC entry 4314 (class 0 OID 0)
-- Dependencies: 265
-- Name: TABLE full_time_employees; Type: COMMENT; Schema: public; Owner: stalin_j
--

COMMENT ON TABLE public.full_time_employees IS 'Table to store full-time employees';


--
-- TOC entry 264 (class 1259 OID 33088)
-- Name: full_time_employees_id_seq; Type: SEQUENCE; Schema: public; Owner: stalin_j
--

CREATE SEQUENCE public.full_time_employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.full_time_employees_id_seq OWNER TO stalin_j;

--
-- TOC entry 4315 (class 0 OID 0)
-- Dependencies: 264
-- Name: full_time_employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stalin_j
--

ALTER SEQUENCE public.full_time_employees_id_seq OWNED BY public.full_time_employees.id;


--
-- TOC entry 263 (class 1259 OID 33073)
-- Name: interns; Type: TABLE; Schema: public; Owner: stalin_j
--

CREATE TABLE public.interns (
    id integer NOT NULL,
    intern_id character varying(100) NOT NULL,
    intern_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    department character varying(100),
    designation character varying(100),
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.interns OWNER TO stalin_j;

--
-- TOC entry 4316 (class 0 OID 0)
-- Dependencies: 263
-- Name: TABLE interns; Type: COMMENT; Schema: public; Owner: stalin_j
--

COMMENT ON TABLE public.interns IS 'Table to store intern employees';


--
-- TOC entry 262 (class 1259 OID 33072)
-- Name: interns_id_seq; Type: SEQUENCE; Schema: public; Owner: stalin_j
--

CREATE SEQUENCE public.interns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interns_id_seq OWNER TO stalin_j;

--
-- TOC entry 4317 (class 0 OID 0)
-- Dependencies: 262
-- Name: interns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: stalin_j
--

ALTER SEQUENCE public.interns_id_seq OWNED BY public.interns.id;


--
-- TOC entry 234 (class 1259 OID 24733)
-- Name: leave_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_balances (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    year integer NOT NULL,
    total_allocated integer DEFAULT 27,
    leaves_taken integer DEFAULT 0,
    leaves_remaining integer DEFAULT 27,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.leave_balances OWNER TO postgres;

--
-- TOC entry 4318 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE leave_balances; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.leave_balances IS 'Employee leave balance tracking';


--
-- TOC entry 233 (class 1259 OID 24732)
-- Name: leave_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_balances_id_seq OWNER TO postgres;

--
-- TOC entry 4319 (class 0 OID 0)
-- Dependencies: 233
-- Name: leave_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_balances_id_seq OWNED BY public.leave_balances.id;


--
-- TOC entry 230 (class 1259 OID 24689)
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_requests (
    id integer NOT NULL,
    series character varying(50) NOT NULL,
    employee_id integer NOT NULL,
    employee_name character varying(255) NOT NULL,
    leave_type character varying(100) NOT NULL,
    leave_balance_before numeric(5,1) NOT NULL,
    from_date date NOT NULL,
    to_date date,
    half_day boolean DEFAULT false,
    total_leave_days numeric(5,1) NOT NULL,
    reason text NOT NULL,
    status character varying(50) DEFAULT 'Pending Manager Approval'::character varying,
    manager_approved_at timestamp without time zone,
    manager_approval_notes text,
    hr_id integer,
    hr_name character varying(255),
    hr_approved_at timestamp without time zone,
    hr_approval_notes text,
    approval_token character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    manager1_id character varying(100),
    manager1_name character varying(100),
    manager1_status character varying(50) DEFAULT 'Pending'::character varying,
    manager2_id character varying(100),
    manager2_name character varying(100),
    manager2_status character varying(50) DEFAULT 'Pending'::character varying,
    manager3_id character varying(100),
    manager3_name character varying(100),
    manager3_status character varying(50) DEFAULT 'Pending'::character varying,
    approved_by integer,
    approved_at timestamp without time zone,
    approval_notes text,
    role character varying(20) DEFAULT 'employee'::character varying
);


ALTER TABLE public.leave_requests OWNER TO postgres;

--
-- TOC entry 4320 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE leave_requests; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.leave_requests IS 'Employee leave requests and approvals';


--
-- TOC entry 229 (class 1259 OID 24688)
-- Name: leave_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_requests_id_seq OWNER TO postgres;

--
-- TOC entry 4321 (class 0 OID 0)
-- Dependencies: 229
-- Name: leave_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_requests_id_seq OWNED BY public.leave_requests.id;


--
-- TOC entry 235 (class 1259 OID 24776)
-- Name: leave_requests_with_manager; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.leave_requests_with_manager AS
 SELECT lr.id,
    lr.series,
    lr.employee_id,
    lr.employee_name,
    lr.leave_type,
    lr.leave_balance_before,
    lr.from_date,
    lr.to_date,
    lr.half_day,
    lr.total_leave_days,
    lr.reason,
    lr.status,
    lr.manager_approved_at,
    lr.manager_approval_notes,
    lr.hr_id,
    lr.hr_name,
    lr.hr_approved_at,
    lr.hr_approval_notes,
    lr.approval_token,
    lr.created_at,
    lr.updated_at,
    COALESCE(em.manager_name, 'Not Assigned'::character varying) AS current_manager_name,
    COALESCE(em.manager_id, ''::character varying) AS current_manager_id
   FROM ((public.leave_requests lr
     LEFT JOIN public.users u ON ((lr.employee_id = u.id)))
     LEFT JOIN public.employee_master em ON (((u.email)::text = (em.company_email)::text)));


ALTER VIEW public.leave_requests_with_manager OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 32901)
-- Name: leave_type_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_type_balances (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    year integer NOT NULL,
    leave_type character varying(100) NOT NULL,
    total_allocated numeric(5,2) DEFAULT 0,
    leaves_taken numeric(5,2) DEFAULT 0,
    leaves_remaining numeric(5,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.leave_type_balances OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 32900)
-- Name: leave_type_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_type_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_type_balances_id_seq OWNER TO postgres;

--
-- TOC entry 4322 (class 0 OID 0)
-- Dependencies: 256
-- Name: leave_type_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_type_balances_id_seq OWNED BY public.leave_type_balances.id;


--
-- TOC entry 232 (class 1259 OID 24719)
-- Name: leave_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_types (
    id integer NOT NULL,
    type_name character varying(100) NOT NULL,
    description text,
    color character varying(20) DEFAULT '#3B82F6'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    max_days integer,
    is_active boolean DEFAULT true
);


ALTER TABLE public.leave_types OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 24718)
-- Name: leave_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_types_id_seq OWNER TO postgres;

--
-- TOC entry 4323 (class 0 OID 0)
-- Dependencies: 231
-- Name: leave_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_types_id_seq OWNED BY public.leave_types.id;


--
-- TOC entry 259 (class 1259 OID 33032)
-- Name: manager_employee_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manager_employee_mapping (
    id integer NOT NULL,
    manager_id integer,
    employee_id integer,
    mapping_type character varying(50) DEFAULT 'primary'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.manager_employee_mapping OWNER TO postgres;

--
-- TOC entry 4324 (class 0 OID 0)
-- Dependencies: 259
-- Name: TABLE manager_employee_mapping; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.manager_employee_mapping IS 'Mapping between managers and their team members';


--
-- TOC entry 258 (class 1259 OID 33031)
-- Name: manager_employee_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.manager_employee_mapping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.manager_employee_mapping_id_seq OWNER TO postgres;

--
-- TOC entry 4325 (class 0 OID 0)
-- Dependencies: 258
-- Name: manager_employee_mapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.manager_employee_mapping_id_seq OWNED BY public.manager_employee_mapping.id;


--
-- TOC entry 226 (class 1259 OID 24655)
-- Name: managers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.managers (
    id integer NOT NULL,
    manager_id character varying(100) NOT NULL,
    manager_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    department character varying(100),
    designation character varying(100),
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer
);


ALTER TABLE public.managers OWNER TO postgres;

--
-- TOC entry 4326 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE managers; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.managers IS 'Manager information and hierarchy';


--
-- TOC entry 225 (class 1259 OID 24654)
-- Name: managers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.managers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.managers_id_seq OWNER TO postgres;

--
-- TOC entry 4327 (class 0 OID 0)
-- Dependencies: 225
-- Name: managers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.managers_id_seq OWNED BY public.managers.id;


--
-- TOC entry 269 (class 1259 OID 33156)
-- Name: migration_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migration_log (
    id integer NOT NULL,
    migration_name character varying(255) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) NOT NULL,
    details text
);


ALTER TABLE public.migration_log OWNER TO postgres;

--
-- TOC entry 268 (class 1259 OID 33155)
-- Name: migration_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migration_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migration_log_id_seq OWNER TO postgres;

--
-- TOC entry 4328 (class 0 OID 0)
-- Dependencies: 268
-- Name: migration_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migration_log_id_seq OWNED BY public.migration_log.id;


--
-- TOC entry 255 (class 1259 OID 32884)
-- Name: monthly_leave_accruals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.monthly_leave_accruals (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    earned_leave_accrued numeric(3,2) DEFAULT 0,
    sick_leave_accrued numeric(3,2) DEFAULT 0,
    casual_leave_accrued numeric(3,2) DEFAULT 0,
    total_earned_leave numeric(5,2) DEFAULT 0,
    total_sick_leave numeric(5,2) DEFAULT 0,
    total_casual_leave numeric(5,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.monthly_leave_accruals OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 32883)
-- Name: monthly_leave_accruals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.monthly_leave_accruals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.monthly_leave_accruals_id_seq OWNER TO postgres;

--
-- TOC entry 4329 (class 0 OID 0)
-- Dependencies: 254
-- Name: monthly_leave_accruals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.monthly_leave_accruals_id_seq OWNED BY public.monthly_leave_accruals.id;


--
-- TOC entry 222 (class 1259 OID 24614)
-- Name: onboarded_employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.onboarded_employees (
    id integer NOT NULL,
    user_id integer,
    employee_id character varying(100),
    company_email character varying(255),
    manager_id character varying(100),
    manager_name character varying(100),
    assigned_by integer,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'pending_assignment'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    employee_type character varying(50)
);


ALTER TABLE public.onboarded_employees OWNER TO postgres;

--
-- TOC entry 4330 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE onboarded_employees; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.onboarded_employees IS 'Intermediate stage for employee approval process';


--
-- TOC entry 221 (class 1259 OID 24613)
-- Name: onboarded_employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.onboarded_employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.onboarded_employees_id_seq OWNER TO postgres;

--
-- TOC entry 4331 (class 0 OID 0)
-- Dependencies: 221
-- Name: onboarded_employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.onboarded_employees_id_seq OWNED BY public.onboarded_employees.id;


--
-- TOC entry 280 (class 1259 OID 37230)
-- Name: relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.relations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.relations OWNER TO postgres;

--
-- TOC entry 279 (class 1259 OID 37229)
-- Name: relations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.relations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.relations_id_seq OWNER TO postgres;

--
-- TOC entry 4332 (class 0 OID 0)
-- Dependencies: 279
-- Name: relations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.relations_id_seq OWNED BY public.relations.id;


--
-- TOC entry 237 (class 1259 OID 24782)
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    total_annual_leaves integer DEFAULT 27,
    allow_half_day boolean DEFAULT true,
    approval_workflow character varying(50) DEFAULT 'manager_then_hr'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- TOC entry 4333 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE system_settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.system_settings IS 'System-wide configuration settings';


--
-- TOC entry 236 (class 1259 OID 24781)
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_id_seq OWNER TO postgres;

--
-- TOC entry 4334 (class 0 OID 0)
-- Dependencies: 236
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- TOC entry 217 (class 1259 OID 24577)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4335 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3721 (class 2604 OID 24674)
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- TOC entry 3812 (class 2604 OID 33061)
-- Name: attendance_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_settings ALTER COLUMN id SET DEFAULT nextval('public.attendance_settings_id_seq'::regclass);


--
-- TOC entry 3758 (class 2604 OID 24848)
-- Name: comp_off_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comp_off_balances ALTER COLUMN id SET DEFAULT nextval('public.comp_off_balances_id_seq'::regclass);


--
-- TOC entry 3764 (class 2604 OID 24871)
-- Name: company_emails id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_emails ALTER COLUMN id SET DEFAULT nextval('public.company_emails_id_seq'::regclass);


--
-- TOC entry 3823 (class 2604 OID 33108)
-- Name: contract_employees id; Type: DEFAULT; Schema: public; Owner: stalin_j
--

ALTER TABLE ONLY public.contract_employees ALTER COLUMN id SET DEFAULT nextval('public.contract_employees_id_seq'::regclass);


--
-- TOC entry 3750 (class 2604 OID 24797)
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- TOC entry 3780 (class 2604 OID 32849)
-- Name: document_collection id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_collection ALTER COLUMN id SET DEFAULT nextval('public.document_collection_id_seq'::regclass);


--
-- TOC entry 3785 (class 2604 OID 32867)
-- Name: document_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_templates ALTER COLUMN id SET DEFAULT nextval('public.document_templates_id_seq'::regclass);


--
-- TOC entry 3841 (class 2604 OID 33803)
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- TOC entry 3754 (class 2604 OID 24828)
-- Name: employee_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_documents ALTER COLUMN id SET DEFAULT nextval('public.employee_documents_id_seq'::regclass);


--
-- TOC entry 3704 (class 2604 OID 24595)
-- Name: employee_forms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_forms ALTER COLUMN id SET DEFAULT nextval('public.employee_forms_id_seq'::regclass);


--
-- TOC entry 3713 (class 2604 OID 24642)
-- Name: employee_master id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_master ALTER COLUMN id SET DEFAULT nextval('public.employee_master_id_seq'::regclass);


--
-- TOC entry 3829 (class 2604 OID 33722)
-- Name: employee_notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_notifications ALTER COLUMN id SET DEFAULT nextval('public.employee_notifications_id_seq'::regclass);


--
-- TOC entry 3778 (class 2604 OID 32806)
-- Name: expense_attachments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_attachments ALTER COLUMN id SET DEFAULT nextval('public.expense_attachments_id_seq'::regclass);


--
-- TOC entry 3833 (class 2604 OID 33761)
-- Name: expense_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories ALTER COLUMN id SET DEFAULT nextval('public.expense_categories_id_seq'::regclass);


--
-- TOC entry 3837 (class 2604 OID 33775)
-- Name: expense_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_requests ALTER COLUMN id SET DEFAULT nextval('public.expense_requests_id_seq'::regclass);


--
-- TOC entry 3769 (class 2604 OID 32772)
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- TOC entry 3819 (class 2604 OID 33092)
-- Name: full_time_employees id; Type: DEFAULT; Schema: public; Owner: stalin_j
--

ALTER TABLE ONLY public.full_time_employees ALTER COLUMN id SET DEFAULT nextval('public.full_time_employees_id_seq'::regclass);


--
-- TOC entry 3815 (class 2604 OID 33076)
-- Name: interns id; Type: DEFAULT; Schema: public; Owner: stalin_j
--

ALTER TABLE ONLY public.interns ALTER COLUMN id SET DEFAULT nextval('public.interns_id_seq'::regclass);


--
-- TOC entry 3738 (class 2604 OID 24736)
-- Name: leave_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances ALTER COLUMN id SET DEFAULT nextval('public.leave_balances_id_seq'::regclass);


--
-- TOC entry 3724 (class 2604 OID 24692)
-- Name: leave_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests ALTER COLUMN id SET DEFAULT nextval('public.leave_requests_id_seq'::regclass);


--
-- TOC entry 3801 (class 2604 OID 32904)
-- Name: leave_type_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_type_balances ALTER COLUMN id SET DEFAULT nextval('public.leave_type_balances_id_seq'::regclass);


--
-- TOC entry 3733 (class 2604 OID 24722)
-- Name: leave_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types ALTER COLUMN id SET DEFAULT nextval('public.leave_types_id_seq'::regclass);


--
-- TOC entry 3807 (class 2604 OID 33035)
-- Name: manager_employee_mapping id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_employee_mapping ALTER COLUMN id SET DEFAULT nextval('public.manager_employee_mapping_id_seq'::regclass);


--
-- TOC entry 3717 (class 2604 OID 24658)
-- Name: managers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers ALTER COLUMN id SET DEFAULT nextval('public.managers_id_seq'::regclass);


--
-- TOC entry 3827 (class 2604 OID 33159)
-- Name: migration_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migration_log ALTER COLUMN id SET DEFAULT nextval('public.migration_log_id_seq'::regclass);


--
-- TOC entry 3792 (class 2604 OID 32887)
-- Name: monthly_leave_accruals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_leave_accruals ALTER COLUMN id SET DEFAULT nextval('public.monthly_leave_accruals_id_seq'::regclass);


--
-- TOC entry 3708 (class 2604 OID 24617)
-- Name: onboarded_employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarded_employees ALTER COLUMN id SET DEFAULT nextval('public.onboarded_employees_id_seq'::regclass);


--
-- TOC entry 3845 (class 2604 OID 37233)
-- Name: relations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relations ALTER COLUMN id SET DEFAULT nextval('public.relations_id_seq'::regclass);


--
-- TOC entry 3744 (class 2604 OID 24785)
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- TOC entry 3699 (class 2604 OID 24581)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4228 (class 0 OID 24671)
-- Dependencies: 228
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, employee_id, date, status, reason, clock_in_time, clock_out_time, created_at, updated_at, hours) FROM stdin;
8	1	2025-09-04	present	\N	\N	\N	2025-09-04 14:20:33.446579	2025-09-04 14:22:23.51348	\N
16	1	2025-09-01	present		\N	\N	2025-09-04 16:46:40.180855	2025-09-04 16:46:40.180855	\N
17	1	2025-09-02	leave		\N	\N	2025-09-04 16:47:31.343174	2025-09-04 16:47:31.343174	\N
18	1	2025-09-03	absent		\N	\N	2025-09-04 16:47:50.049928	2025-09-04 16:47:50.049928	\N
73	49	2025-09-08	present	\N	\N	\N	2025-09-08 00:38:29.883569	2025-09-08 00:47:01.183015	\N
75	49	2025-09-07	present	\N	\N	\N	2025-09-08 00:49:08.629805	2025-09-08 00:49:08.629805	\N
76	49	2025-09-09	Work From Home	\N	\N	\N	2025-09-08 00:49:14.432511	2025-09-08 00:49:14.432511	\N
74	49	2025-09-10	leave	\N	\N	\N	2025-09-08 00:41:43.057964	2025-09-08 00:49:20.827854	\N
77	49	2025-09-11	Half Day	\N	\N	\N	2025-09-08 00:49:27.363774	2025-09-08 00:49:27.363774	\N
24	50	2025-09-01	present	\N	17:35:00	\N	2025-09-05 17:57:17.778831	2025-09-06 17:35:59.728634	8
41	50	2025-09-08	Half Day	\N	\N	\N	2025-09-05 20:00:32.29435	2025-09-05 20:00:32.29435	4
42	50	2025-09-09	Half Day	\N	\N	\N	2025-09-05 20:00:32.29435	2025-09-05 20:00:32.29435	4
43	50	2025-09-10	Half Day	\N	\N	\N	2025-09-05 20:00:32.29435	2025-09-05 20:00:32.29435	4
44	50	2025-09-11	Half Day	\N	\N	\N	2025-09-05 20:00:32.29435	2025-09-05 20:00:32.29435	4
45	50	2025-09-12	Half Day	\N	\N	\N	2025-09-05 20:00:32.29435	2025-09-05 20:00:32.29435	4
32	50	2024-12-17	Work From Home	\N	\N	\N	2025-09-05 19:46:27.894756	2025-09-05 19:46:27.894756	4
26	50	2025-09-03	Work From Home	\N	18:41:00	\N	2025-09-05 17:57:22.509264	2025-09-05 18:44:07.936116	4
31	50	2024-12-16	present	\N	\N	\N	2025-09-05 19:46:27.894756	2025-09-05 19:46:27.894756	8
33	50	2024-12-18	present	\N	\N	\N	2025-09-05 19:46:27.894756	2025-09-05 19:46:27.894756	8
34	50	2024-12-19	present	\N	\N	\N	2025-09-05 19:46:27.894756	2025-09-05 19:46:27.894756	8
35	50	2024-12-20	present	\N	\N	\N	2025-09-05 19:46:27.894756	2025-09-05 19:46:27.894756	8
27	50	2025-09-04	Half Day	\N	21:27:00	\N	2025-09-05 17:57:24.656914	2025-09-05 21:28:06.531809	8
25	50	2025-09-02	present	\N	18:41:00	\N	2025-09-05 17:57:20.285886	2025-09-05 18:44:05.678668	8
20	50	2025-09-05	present	\N	18:41:00	\N	2025-09-05 08:48:20.88084	2025-09-05 18:43:40.66436	8
40	50	2025-09-06	present	\N	\N	\N	2025-09-05 19:51:21.06637	2025-09-05 19:51:21.06637	8
81	53	2025-09-08	present	\N	\N	\N	2025-09-08 12:06:09.187392	2025-09-08 12:06:17.298188	4
\.


--
-- TOC entry 4260 (class 0 OID 33058)
-- Dependencies: 261
-- Data for Name: attendance_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_settings (id, setting_key, setting_value, description, created_at, updated_at) FROM stdin;
1	working_hours	8	Standard working hours per day	2025-09-03 00:47:30.659947	2025-09-03 00:47:30.659947
2	check_in_time	09:00	Standard check-in time	2025-09-03 00:47:30.659947	2025-09-03 00:47:30.659947
3	check_out_time	18:00	Standard check-out time	2025-09-03 00:47:30.659947	2025-09-03 00:47:30.659947
4	late_threshold_minutes	15	Minutes after check-in time to be considered late	2025-09-03 00:47:30.659947	2025-09-03 00:47:30.659947
5	early_leave_threshold_minutes	30	Minutes before check-out time to be considered early leave	2025-09-03 00:47:30.659947	2025-09-03 00:47:30.659947
6	allow_attendance_edit_days	7	Number of days in the past for which attendance can be edited	2025-09-03 00:47:30.659947	2025-09-03 00:47:30.659947
7	manager_edit_attendance_days	30	Number of days in the past for which managers can edit attendance	2025-09-03 00:47:30.659947	2025-09-03 00:47:30.659947
1030	allow_edit_past_days	true	Allow employees to edit attendance for past days	2025-09-04 14:59:38.588648	2025-09-04 14:59:38.588648
1031	max_edit_days	7	Maximum number of days in the past that can be edited	2025-09-04 14:59:38.588648	2025-09-04 14:59:38.588648
1032	require_check_in_time	false	Require check-in time when marking attendance	2025-09-04 14:59:38.588648	2025-09-04 14:59:38.588648
1033	require_check_out_time	false	Require check-out time when marking attendance	2025-09-04 14:59:38.588648	2025-09-04 14:59:38.588648
1034	default_work_hours	8	Default work hours per day	2025-09-04 14:59:38.588648	2025-09-04 14:59:38.588648
1035	week_start_day	monday	First day of the work week	2025-09-04 14:59:38.588648	2025-09-04 14:59:38.588648
1036	timezone	UTC	Default timezone for attendance records	2025-09-04 14:59:38.588648	2025-09-04 14:59:38.588648
1037	auto_approve_attendance	true	Automatically approve attendance submissions	2025-09-04 14:59:38.588648	2025-09-04 14:59:38.588648
1038	notification_enabled	true	Enable attendance notifications	2025-09-04 14:59:38.588648	2025-09-04 14:59:38.588648
\.


--
-- TOC entry 4242 (class 0 OID 24845)
-- Dependencies: 243
-- Data for Name: comp_off_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comp_off_balances (id, employee_id, year, total_earned, comp_off_taken, comp_off_remaining, created_at, updated_at) FROM stdin;
5	49	2025	0.0	0.0	0.0	2025-09-08 01:43:52.914648	2025-09-08 01:43:52.914648
\.


--
-- TOC entry 4244 (class 0 OID 24868)
-- Dependencies: 245
-- Data for Name: company_emails; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_emails (id, user_id, manager_id, company_email, is_primary, is_active, created_at, updated_at) FROM stdin;
111	1	\N	hr@nxzen.com	t	t	2025-09-04 13:32:47.614712	2025-09-04 13:32:47.614712
120	23	\N	test.employee@nxzen.com	t	t	2025-09-04 14:24:06.036493	2025-09-04 14:24:06.036493
\.


--
-- TOC entry 4266 (class 0 OID 33105)
-- Dependencies: 267
-- Data for Name: contract_employees; Type: TABLE DATA; Schema: public; Owner: stalin_j
--

COPY public.contract_employees (id, employee_id, employee_name, email, department, designation, contract_start_date, contract_end_date, status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4238 (class 0 OID 24794)
-- Dependencies: 239
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, code, description, manager_id, is_active, created_at, updated_at) FROM stdin;
1	Engineering	ENG	Software development and technical teams	\N	t	2025-09-04 03:20:17.544725	2025-09-04 03:20:17.544725
2	Product	PRD	Product management and strategy	\N	t	2025-09-04 03:20:17.544725	2025-09-04 03:20:17.544725
3	Design	DSN	UI/UX and graphic design	\N	t	2025-09-04 03:20:17.544725	2025-09-04 03:20:17.544725
4	Marketing	MKT	Marketing and communications	\N	t	2025-09-04 03:20:17.544725	2025-09-04 03:20:17.544725
5	Human Resources	HR	HR and administrative functions	\N	t	2025-09-04 03:20:17.544725	2025-09-04 03:20:17.544725
\.


--
-- TOC entry 4250 (class 0 OID 32846)
-- Dependencies: 251
-- Data for Name: document_collection; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_collection (id, employee_id, employee_name, emp_id, department, join_date, due_date, document_name, document_type, status, notes, uploaded_file_url, uploaded_file_name, uploaded_at, created_at, updated_at) FROM stdin;
118	49	Stalin J	49	N/A	2025-09-07	2025-10-07	SSC Certificate (10th)	ssc_certificate	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 00:33:30.436525	2025-09-08 00:33:30.436525
119	49	Stalin J	49	N/A	2025-09-07	2025-10-07	SSC Marksheet (10th)	ssc_marksheet	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 00:33:30.438468	2025-09-08 00:33:30.438468
120	49	Stalin J	49	N/A	2025-09-07	2025-10-07	HSC Certificate (12th)	hsc_certificate	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 00:33:30.439253	2025-09-08 00:33:30.439253
121	49	Stalin J	49	N/A	2025-09-07	2025-10-07	HSC Marksheet (12th)	hsc_marksheet	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 00:33:30.440373	2025-09-08 00:33:30.440373
122	49	Stalin J	49	N/A	2025-09-07	2025-10-07	Graduation Consolidated Marksheet	graduation_marksheet	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 00:33:30.441257	2025-09-08 00:33:30.441257
123	49	Stalin J	49	N/A	2025-09-07	2025-10-07	Latest Graduation	graduation_certificate	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 00:33:30.4421	2025-09-08 00:33:30.4421
124	49	Stalin J	49	N/A	2025-09-07	2025-10-07	Aadhaar Card	aadhaar	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 00:33:30.444237	2025-09-08 00:33:30.444237
125	49	Stalin J	49	N/A	2025-09-07	2025-10-07	PAN Card	pan	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 00:33:30.445428	2025-09-08 00:33:30.445428
126	49	Stalin J	49	N/A	2025-09-07	2025-10-07	Updated Resume	resume	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 00:33:30.446527	2025-09-08 00:33:30.446527
136	53	Stalin J	53	N/A	2025-09-07	2025-10-07	SSC Certificate (10th)	ssc_certificate	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 02:49:47.481229	2025-09-08 02:49:47.481229
137	53	Stalin J	53	N/A	2025-09-07	2025-10-07	SSC Marksheet (10th)	ssc_marksheet	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 02:49:47.483642	2025-09-08 02:49:47.483642
138	53	Stalin J	53	N/A	2025-09-07	2025-10-07	HSC Certificate (12th)	hsc_certificate	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 02:49:47.484312	2025-09-08 02:49:47.484312
139	53	Stalin J	53	N/A	2025-09-07	2025-10-07	HSC Marksheet (12th)	hsc_marksheet	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 02:49:47.484985	2025-09-08 02:49:47.484985
140	53	Stalin J	53	N/A	2025-09-07	2025-10-07	Graduation Consolidated Marksheet	graduation_marksheet	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 02:49:47.485516	2025-09-08 02:49:47.485516
141	53	Stalin J	53	N/A	2025-09-07	2025-10-07	Latest Graduation	graduation_certificate	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 02:49:47.487494	2025-09-08 02:49:47.487494
142	53	Stalin J	53	N/A	2025-09-07	2025-10-07	Aadhaar Card	aadhaar	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 02:49:47.488899	2025-09-08 02:49:47.488899
143	53	Stalin J	53	N/A	2025-09-07	2025-10-07	PAN Card	pan	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 02:49:47.489431	2025-09-08 02:49:47.489431
144	53	Stalin J	53	N/A	2025-09-07	2025-10-07	Passport	passport	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 02:49:47.490085	2025-09-08 02:49:47.490085
145	53	Stalin J	53	N/A	2025-09-07	2025-10-07	Updated Resume	resume	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 02:49:47.490695	2025-09-08 02:49:47.490695
146	53	Stalin J	53	N/A	2025-09-07	2025-10-07	Offer & Appointment Letter	offer_letter	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 02:49:47.491309	2025-09-08 02:49:47.491309
147	53	Stalin J	53	N/A	2025-09-07	2025-10-07	Latest Compensation Letter	compensation_letter	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 02:49:47.491908	2025-09-08 02:49:47.491908
148	53	Stalin J	53	N/A	2025-09-07	2025-10-07	Experience & Relieving Letter	experience_letter	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 02:49:47.492518	2025-09-08 02:49:47.492518
149	53	Stalin J	53	N/A	2025-09-07	2025-10-07	Latest 3 Months Pay Slips	payslip	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 02:49:47.493432	2025-09-08 02:49:47.493432
150	53	Stalin J	53	N/A	2025-09-07	2025-10-07	Form 16 / Form 12B / Taxable Income Statement	form16	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 02:49:47.494482	2025-09-08 02:49:47.494482
151	54	Zoro M	54	N/A	2025-09-08	2025-10-08	SSC Certificate (10th)	ssc_certificate	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 12:36:00.691559	2025-09-08 12:36:00.691559
152	54	Zoro M	54	N/A	2025-09-08	2025-10-08	SSC Marksheet (10th)	ssc_marksheet	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 12:36:00.695404	2025-09-08 12:36:00.695404
153	54	Zoro M	54	N/A	2025-09-08	2025-10-08	HSC Certificate (12th)	hsc_certificate	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 12:36:00.696107	2025-09-08 12:36:00.696107
154	54	Zoro M	54	N/A	2025-09-08	2025-10-08	HSC Marksheet (12th)	hsc_marksheet	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 12:36:00.697304	2025-09-08 12:36:00.697304
155	54	Zoro M	54	N/A	2025-09-08	2025-10-08	Graduation Consolidated Marksheet	graduation_marksheet	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 12:36:00.698376	2025-09-08 12:36:00.698376
156	54	Zoro M	54	N/A	2025-09-08	2025-10-08	Latest Graduation	graduation_certificate	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 12:36:00.699581	2025-09-08 12:36:00.699581
157	54	Zoro M	54	N/A	2025-09-08	2025-10-08	Aadhaar Card	aadhaar	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 12:36:00.700787	2025-09-08 12:36:00.700787
158	54	Zoro M	54	N/A	2025-09-08	2025-10-08	PAN Card	pan	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 12:36:00.701301	2025-09-08 12:36:00.701301
159	54	Zoro M	54	N/A	2025-09-08	2025-10-08	Passport	passport	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 12:36:00.701844	2025-09-08 12:36:00.701844
160	54	Zoro M	54	N/A	2025-09-08	2025-10-08	Updated Resume	resume	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 12:36:00.702726	2025-09-08 12:36:00.702726
161	54	Zoro M	54	N/A	2025-09-08	2025-10-08	Offer & Appointment Letter	offer_letter	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 12:36:00.703594	2025-09-08 12:36:00.703594
162	54	Zoro M	54	N/A	2025-09-08	2025-10-08	Latest Compensation Letter	compensation_letter	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 12:36:00.704454	2025-09-08 12:36:00.704454
163	54	Zoro M	54	N/A	2025-09-08	2025-10-08	Experience & Relieving Letter	experience_letter	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 12:36:00.705275	2025-09-08 12:36:00.705275
164	54	Zoro M	54	N/A	2025-09-08	2025-10-08	Latest 3 Months Pay Slips	payslip	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 12:36:00.706142	2025-09-08 12:36:00.706142
165	54	Zoro M	54	N/A	2025-09-08	2025-10-08	Form 16 / Form 12B / Taxable Income Statement	form16	Not Uploaded	Document required for onboarding	\N	\N	\N	2025-09-08 12:36:00.706962	2025-09-08 12:36:00.706962
\.


--
-- TOC entry 4252 (class 0 OID 32864)
-- Dependencies: 253
-- Data for Name: document_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_templates (id, document_name, document_type, description, is_active, created_at, updated_at, category, is_required, allow_multiple) FROM stdin;
9	Passport Size Photographs	Required	Recent passport size photographs	t	2025-09-01 08:21:28.000725	2025-09-01 08:21:28.000725	\N	f	f
2383	SSC Certificate (10th)	ssc_certificate	Secondary School Certificate for 10th standard	t	2025-09-01 19:12:26.889746	2025-09-02 23:19:19.806572	education	f	f
2384	SSC Marksheet (10th)	ssc_marksheet	Secondary School Certificate marksheet for 10th standard	t	2025-09-01 19:12:26.889746	2025-09-02 23:19:19.806851	education	f	f
2385	HSC Certificate (12th)	hsc_certificate	Higher Secondary Certificate for 12th standard	t	2025-09-01 19:12:26.889746	2025-09-02 23:19:19.807216	education	f	f
2386	HSC Marksheet (12th)	hsc_marksheet	Higher Secondary Certificate marksheet for 12th standard	t	2025-09-01 19:12:26.889746	2025-09-02 23:19:19.807563	education	f	f
2388	Graduation Original/Provisional Certificate	graduation_certificate	Graduation original or provisional certificate	t	2025-09-01 19:12:26.889746	2025-09-02 23:19:19.808357	education	t	f
2387	Graduation Consolidated Marksheet	graduation_marksheet	Graduation consolidated marksheet	t	2025-09-01 19:12:26.889746	2025-09-02 23:19:19.808054	education	f	f
4665	Latest Graduation	graduation_certificate	Latest graduation certificate	t	2025-09-04 00:22:53.670433	2025-09-04 00:22:53.670433	education	t	f
2389	Post-Graduation Marksheet	postgrad_marksheet	Post-graduation marksheet if applicable	t	2025-09-01 19:12:26.889746	2025-09-02 23:19:19.808687	education	f	f
2390	Post-Graduation Certificate	postgrad_certificate	Post-graduation certificate if applicable	t	2025-09-01 19:12:26.889746	2025-09-02 23:19:19.808935	education	f	f
8	Aadhaar Card	aadhaar	Aadhaar card for identity verification	t	2025-09-01 08:21:28.000725	2025-09-02 23:19:19.809179	identity	t	f
7	PAN Card	pan	Permanent Account Number card for tax purposes	t	2025-09-01 08:21:28.000725	2025-09-02 23:19:19.809436	identity	t	f
2393	Passport	passport	Passport for identity verification	t	2025-09-01 19:12:26.889746	2025-09-02 23:19:19.80966	identity	f	f
10	Address Proof	address_proof	Valid address proof document	t	2025-09-01 08:21:28.000725	2025-09-02 23:19:19.809868	identity	f	f
11	Educational Certificates	educational_certificates	Relevant educational qualification certificates	t	2025-09-01 08:21:28.000725	2025-09-02 23:19:19.810117	education	f	t
12	Professional Certifications	professional_certifications	Professional certifications and training documents	t	2025-09-01 08:21:28.000725	2025-09-02 23:19:19.810437	employment	f	t
1	Updated Resume	resume	Current resume with latest experience and skills	t	2025-09-01 08:21:28.000725	2025-09-02 23:19:19.796299	employment	f	f
2	Offer & Appointment Letter	offer_letter	Official offer letter and appointment confirmation	t	2025-09-01 08:21:28.000725	2025-09-02 23:19:19.804258	employment	f	f
3	Latest Compensation Letter	compensation_letter	Most recent salary and compensation details	t	2025-09-01 08:21:28.000725	2025-09-02 23:19:19.804985	employment	f	f
4	Experience & Relieving Letter	experience_letter	Previous employment experience and relieving letter	t	2025-09-01 08:21:28.000725	2025-09-02 23:19:19.805343	employment	f	f
5	Latest 3 Months Pay Slips	payslip	Pay slips from the last 3 months of previous employment	t	2025-09-01 08:21:28.000725	2025-09-02 23:19:19.805684	employment	f	t
6	Form 16 / Form 12B / Taxable Income Statement	form16	Tax-related documents for income verification	t	2025-09-01 08:21:28.000725	2025-09-02 23:19:19.806183	employment	f	f
\.


--
-- TOC entry 4276 (class 0 OID 33800)
-- Dependencies: 277
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, employee_id, document_type, file_name, file_path, file_size, mime_type, status, uploaded_by, reviewed_by, reviewed_at, review_notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4240 (class 0 OID 24825)
-- Dependencies: 241
-- Data for Name: employee_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_documents (id, employee_id, document_type, document_category, file_name, file_url, file_size, mime_type, is_required, uploaded_at, updated_at) FROM stdin;
40	49	graduation_certificate	education	ChatGPT Image Sep 7, 2025, 04_11_40 PM.png	uploads/documents/documents-1757271776775-231706534.png	1226293	image/png	f	2025-09-08 00:32:56.79801	2025-09-08 00:32:56.79801
41	49	aadhaar	identity	ChatGPT Image Sep 7, 2025, 04_11_40 PM.png	uploads/documents/documents-1757271782555-9401075.png	1226293	image/png	f	2025-09-08 00:33:02.562076	2025-09-08 00:33:02.562076
42	49	pan	identity	ChatGPT Image Sep 7, 2025, 04_23_02 PM.png	uploads/documents/documents-1757271786739-571840128.png	1684466	image/png	f	2025-09-08 00:33:06.749189	2025-09-08 00:33:06.749189
46	53	graduation_certificate	education	ChatGPT Image Sep 7, 2025, 04_23_02 PM.png	uploads/documents/documents-1757279947108-911257247.png	1684466	image/png	f	2025-09-08 02:49:07.137098	2025-09-08 02:49:07.137098
47	53	aadhaar	identity	ChatGPT Image Sep 7, 2025, 04_23_02 PM.png	uploads/documents/documents-1757279953558-360090328.png	1684466	image/png	f	2025-09-08 02:49:13.567073	2025-09-08 02:49:13.567073
48	53	pan	identity	ChatGPT Image Sep 7, 2025, 04_23_02 PM.png	uploads/documents/documents-1757279957963-43771475.png	1684466	image/png	f	2025-09-08 02:49:17.974266	2025-09-08 02:49:17.974266
49	54	graduation_certificate	education	ChatGPT Image Sep 7, 2025, 04_23_02 PM.png	uploads/documents/documents-1757315122157-599062340.png	1684466	image/png	f	2025-09-08 12:35:22.167729	2025-09-08 12:35:22.167729
50	54	aadhaar	identity	ChatGPT Image Sep 7, 2025, 04_23_02 PM.png	uploads/documents/documents-1757315127850-258391706.png	1684466	image/png	f	2025-09-08 12:35:27.857446	2025-09-08 12:35:27.857446
51	54	pan	identity	ChatGPT Image Sep 7, 2025, 04_11_40 PM.png	uploads/documents/documents-1757315132579-731814191.png	1226293	image/png	f	2025-09-08 12:35:32.586345	2025-09-08 12:35:32.586345
\.


--
-- TOC entry 4220 (class 0 OID 24592)
-- Dependencies: 220
-- Data for Name: employee_forms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_forms (id, employee_id, type, form_data, files, status, submitted_at, updated_at, reviewed_by, reviewed_at, review_notes, assigned_manager, manager2_name, manager3_name, draft_data, documents_uploaded) FROM stdin;
32	49	Intern	{"doj": "2025-09-01", "name": "Stalin", "email": "jstalin826@gmail.com", "phone": "7364782367", "address": "dgfsajdgjsagj", "education": "hsvdjha", "experience": "", "submittedAt": "2025-09-07T19:02:44.384Z", "emergencyContact": {"name": "vdashjdvja", "phone": "4687236487", "relationship": "hcvchsd"}, "emergencyContact2": {"name": "hjvchjasdvd", "phone": "7462873687", "relationship": "chjhdjsa"}}	{}	approved	2025-09-08 00:27:42.378216	2025-09-08 00:33:30.428661	\N	\N	\N	\N	\N	\N	\N	\N
25	50	Manager	\N	\N	pending	2025-09-05 01:55:18.934168	2025-09-05 01:55:18.934168	\N	\N	\N	\N	\N	\N	\N	\N
36	54	Manager	{"doj": "2025-07-07", "name": "Zoro M", "email": "stalinnithin3434@gmail.com", "phone": "6576585875", "address": "gvghdvjhgvjdhv", "education": "hvjhfcvjhc", "experience": "", "submittedAt": "2025-09-08T07:05:14.036Z", "emergencyContact": {"name": "gvcdghvc", "phone": "3657635763", "relationship": "bghdvhgc"}, "emergencyContact2": {"name": "hjvcjhvds", "phone": "6536757657", "relationship": "gvchjgd"}}	{}	approved	2025-09-08 12:29:00.302341	2025-09-08 12:37:00.20334	\N	\N	\N	Luffy D			\N	\N
35	53	Full-Time	{"doj": "2025-09-01", "name": "Stalin", "email": "stalinnithin31@gmail.com", "phone": "5758758758", "address": "cbjhb", "education": "hjdcbhjds", "experience": "", "submittedAt": "2025-09-07T21:18:56.796Z", "emergencyContact": {"name": "cdjhsd", "phone": "6576576576", "relationship": "hcbdsjh"}, "emergencyContact2": {"name": "hbdchjs", "phone": "5755875875", "relationship": "djhcbhsj"}}	{}	approved	2025-09-08 02:47:14.517672	2025-09-08 12:38:02.986857	\N	\N	\N	Luffy D	Zoro M		\N	\N
37	55	Intern	\N	\N	pending	2025-09-08 12:40:49.474884	2025-09-08 12:40:49.474884	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- TOC entry 4224 (class 0 OID 24639)
-- Dependencies: 224
-- Data for Name: employee_master; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_master (id, employee_id, employee_name, company_email, manager_id, manager_name, type, role, doj, status, department, designation, salary_band, location, created_at, updated_at, department_id, manager2_id, manager2_name, manager3_id, manager3_name) FROM stdin;
26	ae2d66	Luffy D	strawhatluff124@gmail.com	\N	\N	Manager	\N	2025-09-05	active	\N	\N	\N	\N	2025-09-05 01:55:18.934168	2025-09-05 01:55:18.934168	\N	\N	\N	\N	\N
32	744716	Stalin	jstalin@nxzen.com	ae2d66	Luffy D	Intern	\N	2025-08-31	active	\N	\N	\N	\N	2025-09-08 00:37:59.577657	2025-09-08 01:00:37.931277	\N	\N	\N	\N	\N
34	634504	Stalin J	stalin31@nxzen.com	ae2d66	Luffy D	Full-Time	\N	2025-09-01	active	\N	\N	\N	\N	2025-09-08 02:50:17.122938	2025-09-08 02:50:17.122938	\N	\N	\N	\N	\N
35	266208	Zoro M	stalin34@nxzen.com	ae2d66	Luffy D	Manager	\N	2025-07-07	active	\N	\N	\N	\N	2025-09-08 12:37:39.710384	2025-09-08 12:37:39.710384	\N	\N	\N	\N	\N
\.


--
-- TOC entry 4270 (class 0 OID 33719)
-- Dependencies: 271
-- Data for Name: employee_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_notifications (id, employee_id, notification_type, title, message, is_read, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4248 (class 0 OID 32803)
-- Dependencies: 249
-- Data for Name: expense_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_attachments (id, expense_id, file_name, file_url, file_size, mime_type, uploaded_at) FROM stdin;
\.


--
-- TOC entry 4272 (class 0 OID 33758)
-- Dependencies: 273
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_categories (id, name, description, is_active, created_at, updated_at) FROM stdin;
1	Travel	Travel and transportation expenses	t	2025-09-05 11:06:38.282422	2025-09-05 11:06:38.282422
2	Meals	Business meal expenses	t	2025-09-05 11:06:38.282422	2025-09-05 11:06:38.282422
3	Office Supplies	Office supplies and equipment	t	2025-09-05 11:06:38.282422	2025-09-05 11:06:38.282422
4	Training	Training and development expenses	t	2025-09-05 11:06:38.282422	2025-09-05 11:06:38.282422
5	Communication	Phone and internet expenses	t	2025-09-05 11:06:38.282422	2025-09-05 11:06:38.282422
6	Others	Miscellaneous expenses	t	2025-09-05 11:06:38.282422	2025-09-05 11:06:38.282422
\.


--
-- TOC entry 4274 (class 0 OID 33772)
-- Dependencies: 275
-- Data for Name: expense_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_requests (id, employee_id, category_id, amount, description, expense_date, receipt_url, status, approved_by, approved_at, approval_notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4246 (class 0 OID 32769)
-- Dependencies: 247
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, series, employee_id, employee_name, expense_category, expense_type, other_category, amount, currency, description, attachment_url, attachment_name, expense_date, project_reference, payment_mode, tax_included, total_reimbursable, status, manager1_id, manager1_name, manager1_status, manager1_approved_at, manager1_approval_notes, manager2_id, manager2_name, manager2_status, manager2_approved_at, manager2_approval_notes, manager3_id, manager3_name, manager3_status, manager3_approved_at, manager3_approval_notes, hr_id, hr_name, hr_approved_at, hr_approval_notes, approval_token, created_at, updated_at, client_code) FROM stdin;
16	EXP-MFA2W33P-O0UGU	49	Stalin J	Travel	Taxi	\N	500.00	INR	ghchg	/uploads/expenses/attachments-1757272863146-755875047.png	ChatGPT Image Sep 7, 2025, 04_11_40 PM.png	2025-09-03	\N	\N	f	500.00	approved	ae2d66	Luffy D	Approved	2025-09-08 00:51:14.943077	Approved via email by Luffy D	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	HR Manager	2025-09-08 00:52:00.666384		06271d5c19beaf88b77fc00fc7ce9785d35b518faf1365bacff21b7a9d0a90a8	2025-09-08 00:51:03.159732	2025-09-08 00:52:00.666384	\N
\.


--
-- TOC entry 4264 (class 0 OID 33089)
-- Dependencies: 265
-- Data for Name: full_time_employees; Type: TABLE DATA; Schema: public; Owner: stalin_j
--

COPY public.full_time_employees (id, employee_id, employee_name, email, department, designation, status, created_at, updated_at) FROM stdin;
1	b68ac3	Test Employee	test.new.employee@company.com	\N	\N	active	2025-09-05 01:41:35.354691	2025-09-05 01:41:35.354691
2	809d30	Test User	testuser1757016901844@example.com	\N	\N	active	2025-09-05 01:45:01.871962	2025-09-05 01:45:01.871962
\.


--
-- TOC entry 4262 (class 0 OID 33073)
-- Dependencies: 263
-- Data for Name: interns; Type: TABLE DATA; Schema: public; Owner: stalin_j
--

COPY public.interns (id, intern_id, intern_name, email, department, designation, status, created_at, updated_at) FROM stdin;
1	3f49fc	stalin J	stalinnithin31@gmail.com	\N	\N	active	2025-09-04 14:01:31.198012	2025-09-04 14:01:31.198012
\.


--
-- TOC entry 4234 (class 0 OID 24733)
-- Dependencies: 234
-- Data for Name: leave_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_balances (id, employee_id, year, total_allocated, leaves_taken, leaves_remaining, created_at, updated_at) FROM stdin;
2	1	2025	15	0	15	2025-09-04 10:56:56.180234	2025-09-04 10:56:56.180234
10	49	2025	15	1	14	2025-09-08 00:49:39.427981	2025-09-08 00:51:54.400461
13	53	2025	15	0	15	2025-09-08 12:06:23.848879	2025-09-08 12:06:23.848879
\.


--
-- TOC entry 4230 (class 0 OID 24689)
-- Dependencies: 230
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_requests (id, series, employee_id, employee_name, leave_type, leave_balance_before, from_date, to_date, half_day, total_leave_days, reason, status, manager_approved_at, manager_approval_notes, hr_id, hr_name, hr_approved_at, hr_approval_notes, approval_token, created_at, updated_at, manager1_id, manager1_name, manager1_status, manager2_id, manager2_name, manager2_status, manager3_id, manager3_name, manager3_status, approved_by, approved_at, approval_notes, role) FROM stdin;
7	LR-MF564406-E5SG9	1	HR Manager	Sick Leave	15.0	2024-02-01	2024-02-03	f	3.0	Not feeling well	rejected	\N	\N	1	HR Manager	2025-09-05 14:08:51.468658		459e028268d3c57f1b9c5f5b9cafc1f94bae23c89768313bca7066fafcbc429c	2025-09-04 14:22:25.546671	2025-09-05 14:08:51.468658	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	employee
6	LR-MF561R38-781XI	1	HR Manager	Sick Leave	15.0	2024-02-01	2024-02-03	f	3.0	Not feeling well	Pending HR Approval	\N	\N	\N	\N	\N	\N	d8aa64375ecc15a48795da7771405446b3d4a6a2d270400eb9e6be4d670b60b6	2025-09-04 14:20:35.498759	2025-09-04 14:20:35.498759	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	employee
18	LR-MFA2UJ9A-09CBC	49	Stalin J	Casual Leave	15.0	2025-09-10	\N	f	1.0	jyfyuff	approved	2025-09-08 00:50:28.861507	\N	1	HR Manager	2025-09-08 00:51:54.400461		b4d87825903800a07c6f341cfbea0884537c64bad2ec7a2cc3f97a798975d7cc	2025-09-08 00:49:50.794645	2025-09-08 00:51:54.400461	ae2d66	Luffy D	Approved	\N	\N	\N	\N	\N	\N	\N	\N	\N	employee
\.


--
-- TOC entry 4256 (class 0 OID 32901)
-- Dependencies: 257
-- Data for Name: leave_type_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_type_balances (id, employee_id, year, leave_type, total_allocated, leaves_taken, leaves_remaining, created_at, updated_at) FROM stdin;
1	624562	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-01 13:44:45.370703	2025-09-01 13:44:45.370703
2	624562	2025	Sick Leave	3.00	0.00	3.00	2025-09-01 13:44:45.370703	2025-09-01 13:44:45.370703
3	624562	2025	Casual Leave	3.00	0.00	3.00	2025-09-01 13:44:45.370703	2025-09-01 13:44:45.370703
4	950792	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-01 13:44:45.379303	2025-09-01 13:44:45.379303
5	950792	2025	Sick Leave	3.00	0.00	3.00	2025-09-01 13:44:45.379303	2025-09-01 13:44:45.379303
6	950792	2025	Casual Leave	3.00	0.00	3.00	2025-09-01 13:44:45.379303	2025-09-01 13:44:45.379303
7	333333	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-01 13:44:45.382026	2025-09-01 13:44:45.382026
8	333333	2025	Sick Leave	3.00	0.00	3.00	2025-09-01 13:44:45.382026	2025-09-01 13:44:45.382026
9	333333	2025	Casual Leave	3.00	0.00	3.00	2025-09-01 13:44:45.382026	2025-09-01 13:44:45.382026
10	26	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-01 13:45:10.605281	2025-09-01 13:45:10.605281
11	26	2025	Sick Leave	3.00	0.00	3.00	2025-09-01 13:45:10.605281	2025-09-01 13:45:10.605281
12	26	2025	Casual Leave	3.00	0.00	3.00	2025-09-01 13:45:10.605281	2025-09-01 13:45:10.605281
13	27	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-01 13:45:10.609559	2025-09-01 13:45:10.609559
14	27	2025	Sick Leave	3.00	0.00	3.00	2025-09-01 13:45:10.609559	2025-09-01 13:45:10.609559
15	27	2025	Casual Leave	3.00	0.00	3.00	2025-09-01 13:45:10.609559	2025-09-01 13:45:10.609559
16	25	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-01 13:45:10.61235	2025-09-01 13:45:10.61235
17	25	2025	Sick Leave	3.00	0.00	3.00	2025-09-01 13:45:10.61235	2025-09-01 13:45:10.61235
18	25	2025	Casual Leave	3.00	0.00	3.00	2025-09-01 13:45:10.61235	2025-09-01 13:45:10.61235
19	28	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-01 13:45:10.61461	2025-09-01 13:45:10.61461
20	28	2025	Sick Leave	3.00	0.00	3.00	2025-09-01 13:45:10.61461	2025-09-01 13:45:10.61461
22	30	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-01 13:45:10.616971	2025-09-01 13:45:10.616971
23	30	2025	Sick Leave	3.00	0.00	3.00	2025-09-01 13:45:10.616971	2025-09-01 13:45:10.616971
24	30	2025	Casual Leave	3.00	0.00	3.00	2025-09-01 13:45:10.616971	2025-09-01 13:45:10.616971
25	24	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-01 13:45:10.619347	2025-09-01 13:45:10.619347
26	24	2025	Sick Leave	3.00	0.00	3.00	2025-09-01 13:45:10.619347	2025-09-01 13:45:10.619347
27	24	2025	Casual Leave	3.00	0.00	3.00	2025-09-01 13:45:10.619347	2025-09-01 13:45:10.619347
28	16	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-01 13:45:10.621784	2025-09-01 13:45:10.621784
29	16	2025	Sick Leave	3.00	0.00	3.00	2025-09-01 13:45:10.621784	2025-09-01 13:45:10.621784
30	16	2025	Casual Leave	3.00	0.00	3.00	2025-09-01 13:45:10.621784	2025-09-01 13:45:10.621784
21	28	2025	Casual Leave	3.00	1.00	2.00	2025-09-01 13:45:10.61461	2025-09-01 14:42:29.687397
31	14	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-01 14:43:47.078445	2025-09-01 14:43:47.078445
32	14	2025	Sick Leave	3.00	0.00	3.00	2025-09-01 14:43:47.078445	2025-09-01 14:43:47.078445
33	14	2025	Casual Leave	3.00	2.00	1.00	2025-09-01 14:43:47.078445	2025-09-01 14:43:47.084881
34	22	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-01 14:43:47.085602	2025-09-01 14:43:47.085602
35	22	2025	Sick Leave	3.00	0.00	3.00	2025-09-01 14:43:47.085602	2025-09-01 14:43:47.085602
36	22	2025	Casual Leave	3.00	1.00	2.00	2025-09-01 14:43:47.085602	2025-09-01 14:43:47.086366
37	29	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-01 20:31:57.480709	2025-09-01 20:31:57.480709
38	29	2025	Sick Leave	3.00	0.00	3.00	2025-09-01 20:31:57.480709	2025-09-01 20:31:57.480709
73	46	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-06 16:15:28.034815	2025-09-06 16:15:28.034815
39	29	2025	Casual Leave	3.00	4.00	-1.00	2025-09-01 20:31:57.480709	2025-09-01 20:41:09.483774
40	51	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-02 12:01:35.777553	2025-09-02 12:01:35.777553
41	51	2025	Sick Leave	3.00	0.00	3.00	2025-09-02 12:01:35.777553	2025-09-02 12:01:35.777553
42	51	2025	Casual Leave	3.00	1.00	2.00	2025-09-02 12:01:35.777553	2025-09-02 12:04:05.868858
43	59	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-02 14:01:54.334363	2025-09-02 14:01:54.334363
44	59	2025	Sick Leave	3.00	0.00	3.00	2025-09-02 14:01:54.334363	2025-09-02 14:01:54.334363
45	59	2025	Casual Leave	3.00	1.00	2.00	2025-09-02 14:01:54.334363	2025-09-02 14:18:31.971444
46	65	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-02 16:24:31.15047	2025-09-02 16:24:31.15047
47	65	2025	Sick Leave	3.00	0.00	3.00	2025-09-02 16:24:31.15047	2025-09-02 16:24:31.15047
48	65	2025	Casual Leave	3.00	1.00	2.00	2025-09-02 16:24:31.15047	2025-09-02 16:26:26.938377
49	67	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-02 18:00:04.725981	2025-09-02 18:00:04.725981
50	67	2025	Sick Leave	3.00	0.00	3.00	2025-09-02 18:00:04.725981	2025-09-02 18:00:04.725981
51	67	2025	Casual Leave	3.00	0.00	3.00	2025-09-02 18:00:04.725981	2025-09-02 18:00:04.725981
52	90	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-03 19:12:53.401902	2025-09-03 19:12:53.401902
53	90	2025	Sick Leave	3.00	0.00	3.00	2025-09-03 19:12:53.401902	2025-09-03 19:12:53.401902
74	46	2025	Sick Leave	3.00	0.00	3.00	2025-09-06 16:15:28.034815	2025-09-06 16:15:28.034815
55	88	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-03 19:51:15.8255	2025-09-03 19:51:15.8255
56	88	2025	Sick Leave	3.00	0.00	3.00	2025-09-03 19:51:15.8255	2025-09-03 19:51:15.8255
57	88	2025	Casual Leave	3.00	1.00	2.00	2025-09-03 19:51:15.8255	2025-09-03 20:03:58.220588
54	90	2025	Casual Leave	3.00	2.00	1.00	2025-09-03 19:12:53.401902	2025-09-03 20:04:12.622658
58	2	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-04 03:42:19.449439	2025-09-04 03:42:19.449439
59	2	2025	Sick Leave	3.00	0.00	3.00	2025-09-04 03:42:19.449439	2025-09-04 03:42:19.449439
60	2	2025	Casual Leave	3.00	1.00	2.00	2025-09-04 03:42:19.449439	2025-09-04 10:25:59.523688
61	41	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-05 07:34:42.610164	2025-09-05 07:34:42.610164
62	41	2025	Sick Leave	3.00	0.00	3.00	2025-09-05 07:34:42.610164	2025-09-05 07:34:42.610164
63	41	2025	Casual Leave	3.00	0.00	3.00	2025-09-05 07:34:42.610164	2025-09-05 07:34:42.610164
64	42	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-05 08:48:43.917992	2025-09-05 08:48:43.917992
65	42	2025	Sick Leave	3.00	0.00	3.00	2025-09-05 08:48:43.917992	2025-09-05 08:48:43.917992
66	42	2025	Casual Leave	3.00	0.00	3.00	2025-09-05 08:48:43.917992	2025-09-05 08:48:43.917992
67	43	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-05 13:46:51.351621	2025-09-05 13:46:51.351621
68	43	2025	Sick Leave	3.00	0.00	3.00	2025-09-05 13:46:51.351621	2025-09-05 13:46:51.351621
69	43	2025	Casual Leave	3.00	1.00	2.00	2025-09-05 13:46:51.351621	2025-09-05 14:05:22.713246
70	44	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-06 12:13:03.433636	2025-09-06 12:13:03.433636
71	44	2025	Sick Leave	3.00	0.00	3.00	2025-09-06 12:13:03.433636	2025-09-06 12:13:03.433636
72	44	2025	Casual Leave	3.00	0.00	3.00	2025-09-06 12:13:03.433636	2025-09-06 12:13:03.433636
75	46	2025	Casual Leave	3.00	0.00	3.00	2025-09-06 16:15:28.034815	2025-09-06 16:15:28.034815
76	48	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-06 18:31:29.922491	2025-09-06 18:31:29.922491
77	48	2025	Sick Leave	3.00	0.00	3.00	2025-09-06 18:31:29.922491	2025-09-06 18:31:29.922491
78	48	2025	Casual Leave	3.00	0.00	3.00	2025-09-06 18:31:29.922491	2025-09-06 18:31:29.922491
80	49	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-08 00:49:39.427743	2025-09-08 00:49:39.427743
81	49	2025	Sick Leave	3.00	0.00	3.00	2025-09-08 00:49:39.427743	2025-09-08 00:49:39.427743
82	49	2025	Casual Leave	3.00	0.00	3.00	2025-09-08 00:49:39.427743	2025-09-08 00:49:39.427743
85	53	2025	Earned/Annual Leave	7.50	0.00	7.50	2025-09-08 12:06:23.849083	2025-09-08 12:06:23.849083
86	53	2025	Sick Leave	3.00	0.00	3.00	2025-09-08 12:06:23.849083	2025-09-08 12:06:23.849083
87	53	2025	Casual Leave	3.00	0.00	3.00	2025-09-08 12:06:23.849083	2025-09-08 12:06:23.849083
\.


--
-- TOC entry 4232 (class 0 OID 24719)
-- Dependencies: 232
-- Data for Name: leave_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_types (id, type_name, description, color, created_at, updated_at, max_days, is_active) FROM stdin;
4	Maternity Leave	Leave for expecting mothers	#8B5CF6	2025-08-29 09:58:36.323483	2025-08-29 09:58:36.323483	\N	t
5	Paternity Leave	Leave for new fathers	#F59E0B	2025-08-29 09:58:36.323483	2025-08-29 09:58:36.323483	\N	t
5268	Comp Off	Compensatory off for overtime work	#84CC16	2025-08-30 17:13:50.557861	2025-08-30 17:13:50.557861	\N	t
7165	Earned/Annual Leave	Annual leave earned monthly (1.25 days/month)	#3B82F6	2025-09-01 13:38:00.565511	2025-09-01 13:45:10.597849	15	t
2	Sick Leave	Medical leave earned monthly (0.5 days/month)	#EF4444	2025-08-29 09:58:36.323483	2025-09-01 13:45:10.599684	6	t
3	Casual Leave	Short-term leave earned monthly (0.5 days/month)	#10B981	2025-08-29 09:58:36.323483	2025-09-01 13:45:10.600081	6	t
\.


--
-- TOC entry 4258 (class 0 OID 33032)
-- Dependencies: 259
-- Data for Name: manager_employee_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.manager_employee_mapping (id, manager_id, employee_id, mapping_type, is_active, created_at, updated_at) FROM stdin;
27	50	49	primary	t	2025-09-08 02:37:15.692895	2025-09-08 02:37:15.692895
28	50	53	primary	t	2025-09-08 02:50:17.126227	2025-09-08 02:50:17.126227
29	50	54	primary	t	2025-09-08 12:37:39.714	2025-09-08 12:37:39.714
\.


--
-- TOC entry 4226 (class 0 OID 24655)
-- Dependencies: 226
-- Data for Name: managers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.managers (id, manager_id, manager_name, email, department, designation, status, created_at, updated_at, user_id) FROM stdin;
30	ae2d66	Luffy D	strawhatluff124@gmail.com	\N	\N	active	2025-09-05 01:55:18.934168	2025-09-05 01:55:18.934168	50
\.


--
-- TOC entry 4268 (class 0 OID 33156)
-- Dependencies: 269
-- Data for Name: migration_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migration_log (id, migration_name, executed_at, status, details) FROM stdin;
1	002_complete_database_setup	2025-09-07 15:35:18.925158	completed	\N
2	002_complete_database_setup	2025-09-07 15:37:09.165817	completed	\N
\.


--
-- TOC entry 4254 (class 0 OID 32884)
-- Dependencies: 255
-- Data for Name: monthly_leave_accruals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.monthly_leave_accruals (id, employee_id, year, month, earned_leave_accrued, sick_leave_accrued, casual_leave_accrued, total_earned_leave, total_sick_leave, total_casual_leave, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4222 (class 0 OID 24614)
-- Dependencies: 222
-- Data for Name: onboarded_employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.onboarded_employees (id, user_id, employee_id, company_email, manager_id, manager_name, assigned_by, assigned_at, status, notes, created_at, updated_at, employee_type) FROM stdin;
10	49	\N	jstalin@nxzen.com	ae2d66	Luffy D	\N	2025-09-08 00:33:30.430493	assigned	Assigned to manager: Luffy D	2025-09-08 00:33:30.430493	2025-09-08 00:37:59.577307	\N
12	53	\N	stalin31@nxzen.com	ae2d66	Luffy D	\N	2025-09-08 02:49:47.47369	assigned	Assigned to manager: Luffy D	2025-09-08 02:49:47.47369	2025-09-08 02:50:17.121169	\N
13	54	\N	stalin34@nxzen.com	ae2d66	Luffy D	\N	2025-09-08 12:36:00.684241	assigned	Assigned to manager: Luffy D	2025-09-08 12:36:00.684241	2025-09-08 12:37:39.709073	\N
\.


--
-- TOC entry 4278 (class 0 OID 37230)
-- Dependencies: 280
-- Data for Name: relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.relations (id, name, is_active, created_at) FROM stdin;
1	Father	t	2025-09-07 15:35:18.917677
2	Mother	t	2025-09-07 15:35:18.917677
3	Spouse	t	2025-09-07 15:35:18.917677
4	Sibling	t	2025-09-07 15:35:18.917677
5	Child	t	2025-09-07 15:35:18.917677
6	Friend	t	2025-09-07 15:35:18.917677
7	Other	t	2025-09-07 15:35:18.917677
\.


--
-- TOC entry 4236 (class 0 OID 24782)
-- Dependencies: 237
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, total_annual_leaves, allow_half_day, approval_workflow, created_at, updated_at) FROM stdin;
1	15	t	manager_then_hr	2025-08-29 20:09:54.234378	2025-09-01 13:43:28.444971
\.


--
-- TOC entry 4218 (class 0 OID 24578)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, role, temp_password, first_name, last_name, phone, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, created_at, updated_at, emergency_contact_name2, emergency_contact_phone2, emergency_contact_relationship2, is_first_login) FROM stdin;
1	hr@nxzen.com	$2a$10$/0p8tek32wWlAJpQhqV0seuqD1aCVc0dqfNoOjwHLdWG1Pjw5iMFm	hr	\N	HR	Manager	\N	\N	\N	\N	\N	2025-09-04 03:20:17.624157	2025-09-05 22:45:23.00869	\N	\N	\N	f
49	jstalin@nxzen.com	$2a$10$UJTToGnGhPPanXsbJNMTR.NNEtbsVbk9Jye.lFsYEmcfHrQXub5xK	employee	\N	Stalin	J	\N	\N	\N	\N	\N	2025-09-08 00:27:42.372552	2025-09-08 00:37:59.571494	\N	\N	\N	t
47	shibinsp007@gmail.com	$2a$10$PmBjSWPTuA/dZb7lag3kg.hU5O7E37cTWdEI0LqndAdjwZOChXoD2	employee	\N	Shibin	SP	\N	\N	\N	\N	\N	2025-09-06 17:54:53.496635	2025-09-06 17:55:59.152138	\N	\N	\N	t
12	pradeep.manager@nxzen.com	$2a$10$UDqhAp9dMvvAqxcY919TCe4.FeKHyLt4QbgnIawMi6CJYksBcENle	employee	\N	Pradeep	Manager	\N	\N	\N	\N	\N	2025-09-04 13:35:17.568565	2025-09-04 13:35:17.568565	\N	\N	\N	t
13	vamshi.manager@nxzen.com	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	employee	\N	Vamshi	Manager	\N	\N	\N	\N	\N	2025-09-04 13:35:17.568565	2025-09-04 13:35:17.568565	\N	\N	\N	t
14	vinod.manager@nxzen.com	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	employee	\N	Vinod	Manager	\N	\N	\N	\N	\N	2025-09-04 13:35:17.568565	2025-09-04 13:35:17.568565	\N	\N	\N	f
15	rakesh.manager@nxzen.com	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	employee	\N	Rakesh	Manager	\N	\N	\N	\N	\N	2025-09-04 13:35:17.568565	2025-09-04 13:35:17.568565	\N	\N	\N	f
23	test.employee@company.com		employee	4AMYUOFE	Test	Employee	\N	\N	\N	\N	\N	2025-09-04 14:22:19.577086	2025-09-04 14:22:19.577086	\N	\N	\N	t
24	dori77284@gmail.com	$2a$10$51fkWt4iLQumpWZCYyjgvO0gPZESN.LLw.XFxZhlIcuFlJt563BMK	employee	\N	dori	d	\N	\N	\N	\N	\N	2025-09-04 14:26:28.709205	2025-09-04 14:28:16.637042	\N	\N	\N	t
18	saigade@gmail.com	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	employee	\N	Sai Ajeeth Reddy	Gade	\N	\N	\N	\N	\N	2025-09-04 13:39:06.741791	2025-09-04 13:39:06.741791	\N	\N	\N	f
28	test.manager@nxzen.com		employee	\N	Test	Manager	\N	\N	\N	\N	\N	2025-09-04 15:46:35.108403	2025-09-04 15:46:35.108403	\N	\N	\N	t
50	strawhatluff124@gmail.com	$2a$10$O4CLgwHAgid1uMOpozShUOQvc6/tCoJPkR6Dk3e4UUwp7E2L6zTWe	manager	\N	Luffy	D	\N	\N	\N	\N	\N	2025-09-08 00:35:54.230834	2025-09-08 00:35:54.230834	\N	\N	\N	t
52	dori7728@gmail.com		employee	EDkTGo93	Dori	D	\N	\N	\N	\N	\N	2025-09-08 02:44:34.828689	2025-09-08 02:44:34.828689	\N	\N	\N	t
53	stalin31@nxzen.com	$2a$10$2Q8DidJjKUBQ7B9m92gj4eFZ/EmyZlyAaSbjYKpD4SOt9mgA5Ja22	employee	\N	Stalin	J	\N	\N	\N	\N	\N	2025-09-08 02:47:14.507602	2025-09-08 02:50:17.11757	\N	\N	\N	t
54	stalin34@nxzen.com	$2a$10$A7sJqnEd9b0pCir0RyFXDu43QhXiGAQMzms5mdvCw.1bAbv2tKvGa	manager	\N	Zoro	M	\N	\N	\N	\N	\N	2025-09-08 12:29:00.295356	2025-09-08 12:37:39.716285	\N	\N	\N	t
55	stalinj4747@gmail.com		employee	ghwqQSCl	Sanji	S	\N	\N	\N	\N	\N	2025-09-08 12:40:49.471666	2025-09-08 12:40:49.471666	\N	\N	\N	t
\.


--
-- TOC entry 4336 (class 0 OID 0)
-- Dependencies: 227
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 81, true);


--
-- TOC entry 4337 (class 0 OID 0)
-- Dependencies: 260
-- Name: attendance_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_settings_id_seq', 1069, true);


--
-- TOC entry 4338 (class 0 OID 0)
-- Dependencies: 242
-- Name: comp_off_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comp_off_balances_id_seq', 5, true);


--
-- TOC entry 4339 (class 0 OID 0)
-- Dependencies: 244
-- Name: company_emails_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_emails_id_seq', 121, true);


--
-- TOC entry 4340 (class 0 OID 0)
-- Dependencies: 266
-- Name: contract_employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stalin_j
--

SELECT pg_catalog.setval('public.contract_employees_id_seq', 1, false);


--
-- TOC entry 4341 (class 0 OID 0)
-- Dependencies: 238
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 605, true);


--
-- TOC entry 4342 (class 0 OID 0)
-- Dependencies: 250
-- Name: document_collection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_collection_id_seq', 165, true);


--
-- TOC entry 4343 (class 0 OID 0)
-- Dependencies: 252
-- Name: document_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_templates_id_seq', 8053, true);


--
-- TOC entry 4344 (class 0 OID 0)
-- Dependencies: 276
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 1, false);


--
-- TOC entry 4345 (class 0 OID 0)
-- Dependencies: 240
-- Name: employee_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_documents_id_seq', 51, true);


--
-- TOC entry 4346 (class 0 OID 0)
-- Dependencies: 219
-- Name: employee_forms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_forms_id_seq', 37, true);


--
-- TOC entry 4347 (class 0 OID 0)
-- Dependencies: 223
-- Name: employee_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_master_id_seq', 35, true);


--
-- TOC entry 4348 (class 0 OID 0)
-- Dependencies: 270
-- Name: employee_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_notifications_id_seq', 2, true);


--
-- TOC entry 4349 (class 0 OID 0)
-- Dependencies: 248
-- Name: expense_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expense_attachments_id_seq', 1, false);


--
-- TOC entry 4350 (class 0 OID 0)
-- Dependencies: 272
-- Name: expense_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expense_categories_id_seq', 18, true);


--
-- TOC entry 4351 (class 0 OID 0)
-- Dependencies: 274
-- Name: expense_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expense_requests_id_seq', 1, false);


--
-- TOC entry 4352 (class 0 OID 0)
-- Dependencies: 246
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expenses_id_seq', 17, true);


--
-- TOC entry 4353 (class 0 OID 0)
-- Dependencies: 264
-- Name: full_time_employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stalin_j
--

SELECT pg_catalog.setval('public.full_time_employees_id_seq', 2, true);


--
-- TOC entry 4354 (class 0 OID 0)
-- Dependencies: 262
-- Name: interns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: stalin_j
--

SELECT pg_catalog.setval('public.interns_id_seq', 1, true);


--
-- TOC entry 4355 (class 0 OID 0)
-- Dependencies: 233
-- Name: leave_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_balances_id_seq', 13, true);


--
-- TOC entry 4356 (class 0 OID 0)
-- Dependencies: 229
-- Name: leave_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_requests_id_seq', 19, true);


--
-- TOC entry 4357 (class 0 OID 0)
-- Dependencies: 256
-- Name: leave_type_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_type_balances_id_seq', 87, true);


--
-- TOC entry 4358 (class 0 OID 0)
-- Dependencies: 231
-- Name: leave_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_types_id_seq', 9888, true);


--
-- TOC entry 4359 (class 0 OID 0)
-- Dependencies: 258
-- Name: manager_employee_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.manager_employee_mapping_id_seq', 29, true);


--
-- TOC entry 4360 (class 0 OID 0)
-- Dependencies: 225
-- Name: managers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.managers_id_seq', 37, true);


--
-- TOC entry 4361 (class 0 OID 0)
-- Dependencies: 268
-- Name: migration_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migration_log_id_seq', 2, true);


--
-- TOC entry 4362 (class 0 OID 0)
-- Dependencies: 254
-- Name: monthly_leave_accruals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.monthly_leave_accruals_id_seq', 1, false);


--
-- TOC entry 4363 (class 0 OID 0)
-- Dependencies: 221
-- Name: onboarded_employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.onboarded_employees_id_seq', 13, true);


--
-- TOC entry 4364 (class 0 OID 0)
-- Dependencies: 279
-- Name: relations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.relations_id_seq', 14, true);


--
-- TOC entry 4365 (class 0 OID 0)
-- Dependencies: 236
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 1, true);


--
-- TOC entry 4366 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 55, true);


--
-- TOC entry 3892 (class 2606 OID 24682)
-- Name: attendance attendance_employee_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_employee_id_date_key UNIQUE (employee_id, date);


--
-- TOC entry 3894 (class 2606 OID 24680)
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- TOC entry 3990 (class 2606 OID 33067)
-- Name: attendance_settings attendance_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_settings
    ADD CONSTRAINT attendance_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3992 (class 2606 OID 33069)
-- Name: attendance_settings attendance_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_settings
    ADD CONSTRAINT attendance_settings_setting_key_key UNIQUE (setting_key);


--
-- TOC entry 3934 (class 2606 OID 24857)
-- Name: comp_off_balances comp_off_balances_employee_id_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comp_off_balances
    ADD CONSTRAINT comp_off_balances_employee_id_year_key UNIQUE (employee_id, year);


--
-- TOC entry 3936 (class 2606 OID 24855)
-- Name: comp_off_balances comp_off_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comp_off_balances
    ADD CONSTRAINT comp_off_balances_pkey PRIMARY KEY (id);


--
-- TOC entry 3939 (class 2606 OID 24880)
-- Name: company_emails company_emails_company_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_emails
    ADD CONSTRAINT company_emails_company_email_key UNIQUE (company_email);


--
-- TOC entry 3941 (class 2606 OID 24878)
-- Name: company_emails company_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_emails
    ADD CONSTRAINT company_emails_pkey PRIMARY KEY (id);


--
-- TOC entry 4010 (class 2606 OID 33119)
-- Name: contract_employees contract_employees_email_key; Type: CONSTRAINT; Schema: public; Owner: stalin_j
--

ALTER TABLE ONLY public.contract_employees
    ADD CONSTRAINT contract_employees_email_key UNIQUE (email);


--
-- TOC entry 4012 (class 2606 OID 33117)
-- Name: contract_employees contract_employees_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: stalin_j
--

ALTER TABLE ONLY public.contract_employees
    ADD CONSTRAINT contract_employees_employee_id_key UNIQUE (employee_id);


--
-- TOC entry 4014 (class 2606 OID 33115)
-- Name: contract_employees contract_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: stalin_j
--

ALTER TABLE ONLY public.contract_employees
    ADD CONSTRAINT contract_employees_pkey PRIMARY KEY (id);


--
-- TOC entry 3921 (class 2606 OID 24808)
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- TOC entry 3923 (class 2606 OID 24806)
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- TOC entry 3925 (class 2606 OID 24804)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 3961 (class 2606 OID 32857)
-- Name: document_collection document_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_collection
    ADD CONSTRAINT document_collection_pkey PRIMARY KEY (id);


--
-- TOC entry 3967 (class 2606 OID 32877)
-- Name: document_templates document_templates_document_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_templates
    ADD CONSTRAINT document_templates_document_name_key UNIQUE (document_name);


--
-- TOC entry 3969 (class 2606 OID 32875)
-- Name: document_templates document_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_templates
    ADD CONSTRAINT document_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 4031 (class 2606 OID 33811)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 3929 (class 2606 OID 24835)
-- Name: employee_documents employee_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT employee_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 3862 (class 2606 OID 24602)
-- Name: employee_forms employee_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_forms
    ADD CONSTRAINT employee_forms_pkey PRIMARY KEY (id);


--
-- TOC entry 3872 (class 2606 OID 24653)
-- Name: employee_master employee_master_company_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_master
    ADD CONSTRAINT employee_master_company_email_key UNIQUE (company_email);


--
-- TOC entry 3874 (class 2606 OID 24651)
-- Name: employee_master employee_master_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_master
    ADD CONSTRAINT employee_master_employee_id_key UNIQUE (employee_id);


--
-- TOC entry 3876 (class 2606 OID 24770)
-- Name: employee_master employee_master_name_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_master
    ADD CONSTRAINT employee_master_name_email_unique UNIQUE (employee_name, company_email);


--
-- TOC entry 3878 (class 2606 OID 24649)
-- Name: employee_master employee_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_master
    ADD CONSTRAINT employee_master_pkey PRIMARY KEY (id);


--
-- TOC entry 4020 (class 2606 OID 33729)
-- Name: employee_notifications employee_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_notifications
    ADD CONSTRAINT employee_notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3958 (class 2606 OID 32811)
-- Name: expense_attachments expense_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_attachments
    ADD CONSTRAINT expense_attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 4022 (class 2606 OID 33770)
-- Name: expense_categories expense_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_name_key UNIQUE (name);


--
-- TOC entry 4024 (class 2606 OID 33768)
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4026 (class 2606 OID 33783)
-- Name: expense_requests expense_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_requests
    ADD CONSTRAINT expense_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 3946 (class 2606 OID 32784)
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- TOC entry 3948 (class 2606 OID 32786)
-- Name: expenses expenses_series_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_series_key UNIQUE (series);


--
-- TOC entry 4002 (class 2606 OID 33103)
-- Name: full_time_employees full_time_employees_email_key; Type: CONSTRAINT; Schema: public; Owner: stalin_j
--

ALTER TABLE ONLY public.full_time_employees
    ADD CONSTRAINT full_time_employees_email_key UNIQUE (email);


--
-- TOC entry 4004 (class 2606 OID 33101)
-- Name: full_time_employees full_time_employees_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: stalin_j
--

ALTER TABLE ONLY public.full_time_employees
    ADD CONSTRAINT full_time_employees_employee_id_key UNIQUE (employee_id);


--
-- TOC entry 4006 (class 2606 OID 33099)
-- Name: full_time_employees full_time_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: stalin_j
--

ALTER TABLE ONLY public.full_time_employees
    ADD CONSTRAINT full_time_employees_pkey PRIMARY KEY (id);


--
-- TOC entry 3996 (class 2606 OID 33087)
-- Name: interns interns_email_key; Type: CONSTRAINT; Schema: public; Owner: stalin_j
--

ALTER TABLE ONLY public.interns
    ADD CONSTRAINT interns_email_key UNIQUE (email);


--
-- TOC entry 3998 (class 2606 OID 33085)
-- Name: interns interns_intern_id_key; Type: CONSTRAINT; Schema: public; Owner: stalin_j
--

ALTER TABLE ONLY public.interns
    ADD CONSTRAINT interns_intern_id_key UNIQUE (intern_id);


--
-- TOC entry 4000 (class 2606 OID 33083)
-- Name: interns interns_pkey; Type: CONSTRAINT; Schema: public; Owner: stalin_j
--

ALTER TABLE ONLY public.interns
    ADD CONSTRAINT interns_pkey PRIMARY KEY (id);


--
-- TOC entry 3915 (class 2606 OID 24745)
-- Name: leave_balances leave_balances_employee_id_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_employee_id_year_key UNIQUE (employee_id, year);


--
-- TOC entry 3917 (class 2606 OID 24743)
-- Name: leave_balances leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_pkey PRIMARY KEY (id);


--
-- TOC entry 3904 (class 2606 OID 24700)
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 3906 (class 2606 OID 24702)
-- Name: leave_requests leave_requests_series_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_series_key UNIQUE (series);


--
-- TOC entry 3979 (class 2606 OID 32913)
-- Name: leave_type_balances leave_type_balances_employee_id_year_leave_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_type_balances
    ADD CONSTRAINT leave_type_balances_employee_id_year_leave_type_key UNIQUE (employee_id, year, leave_type);


--
-- TOC entry 3981 (class 2606 OID 32911)
-- Name: leave_type_balances leave_type_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_type_balances
    ADD CONSTRAINT leave_type_balances_pkey PRIMARY KEY (id);


--
-- TOC entry 3909 (class 2606 OID 24729)
-- Name: leave_types leave_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_pkey PRIMARY KEY (id);


--
-- TOC entry 3911 (class 2606 OID 24731)
-- Name: leave_types leave_types_type_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_type_name_key UNIQUE (type_name);


--
-- TOC entry 3986 (class 2606 OID 33043)
-- Name: manager_employee_mapping manager_employee_mapping_manager_id_employee_id_mapping_typ_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_employee_mapping
    ADD CONSTRAINT manager_employee_mapping_manager_id_employee_id_mapping_typ_key UNIQUE (manager_id, employee_id, mapping_type);


--
-- TOC entry 3988 (class 2606 OID 33041)
-- Name: manager_employee_mapping manager_employee_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_employee_mapping
    ADD CONSTRAINT manager_employee_mapping_pkey PRIMARY KEY (id);


--
-- TOC entry 3886 (class 2606 OID 24669)
-- Name: managers managers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_email_key UNIQUE (email);


--
-- TOC entry 3888 (class 2606 OID 24667)
-- Name: managers managers_manager_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_manager_id_key UNIQUE (manager_id);


--
-- TOC entry 3890 (class 2606 OID 24665)
-- Name: managers managers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_pkey PRIMARY KEY (id);


--
-- TOC entry 4018 (class 2606 OID 33164)
-- Name: migration_log migration_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migration_log
    ADD CONSTRAINT migration_log_pkey PRIMARY KEY (id);


--
-- TOC entry 3973 (class 2606 OID 32899)
-- Name: monthly_leave_accruals monthly_leave_accruals_employee_id_year_month_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_leave_accruals
    ADD CONSTRAINT monthly_leave_accruals_employee_id_year_month_key UNIQUE (employee_id, year, month);


--
-- TOC entry 3975 (class 2606 OID 32897)
-- Name: monthly_leave_accruals monthly_leave_accruals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_leave_accruals
    ADD CONSTRAINT monthly_leave_accruals_pkey PRIMARY KEY (id);


--
-- TOC entry 3868 (class 2606 OID 24625)
-- Name: onboarded_employees onboarded_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarded_employees
    ADD CONSTRAINT onboarded_employees_pkey PRIMARY KEY (id);


--
-- TOC entry 3870 (class 2606 OID 24627)
-- Name: onboarded_employees onboarded_employees_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarded_employees
    ADD CONSTRAINT onboarded_employees_user_id_key UNIQUE (user_id);


--
-- TOC entry 4036 (class 2606 OID 37239)
-- Name: relations relations_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relations
    ADD CONSTRAINT relations_name_key UNIQUE (name);


--
-- TOC entry 4038 (class 2606 OID 37237)
-- Name: relations relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.relations
    ADD CONSTRAINT relations_pkey PRIMARY KEY (id);


--
-- TOC entry 3919 (class 2606 OID 24792)
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3858 (class 2606 OID 24590)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3860 (class 2606 OID 24588)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3895 (class 1259 OID 24761)
-- Name: idx_attendance_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_date ON public.attendance USING btree (date);


--
-- TOC entry 3896 (class 1259 OID 33750)
-- Name: idx_attendance_employee_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_employee_date ON public.attendance USING btree (employee_id, date);


--
-- TOC entry 3897 (class 1259 OID 24760)
-- Name: idx_attendance_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_employee_id ON public.attendance USING btree (employee_id);


--
-- TOC entry 3898 (class 1259 OID 33751)
-- Name: idx_attendance_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_status ON public.attendance USING btree (status);


--
-- TOC entry 3937 (class 1259 OID 24863)
-- Name: idx_comp_off_balances_employee_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comp_off_balances_employee_year ON public.comp_off_balances USING btree (employee_id, year);


--
-- TOC entry 3942 (class 1259 OID 24893)
-- Name: idx_company_emails_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_emails_email ON public.company_emails USING btree (company_email);


--
-- TOC entry 3943 (class 1259 OID 24892)
-- Name: idx_company_emails_manager_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_emails_manager_id ON public.company_emails USING btree (manager_id);


--
-- TOC entry 3944 (class 1259 OID 24891)
-- Name: idx_company_emails_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_emails_user_id ON public.company_emails USING btree (user_id);


--
-- TOC entry 4015 (class 1259 OID 33125)
-- Name: idx_contract_employees_email; Type: INDEX; Schema: public; Owner: stalin_j
--

CREATE INDEX idx_contract_employees_email ON public.contract_employees USING btree (email);


--
-- TOC entry 4016 (class 1259 OID 33124)
-- Name: idx_contract_employees_employee_id; Type: INDEX; Schema: public; Owner: stalin_j
--

CREATE INDEX idx_contract_employees_employee_id ON public.contract_employees USING btree (employee_id);


--
-- TOC entry 3926 (class 1259 OID 24821)
-- Name: idx_departments_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_departments_code ON public.departments USING btree (code);


--
-- TOC entry 3927 (class 1259 OID 24820)
-- Name: idx_departments_manager_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_departments_manager_id ON public.departments USING btree (manager_id);


--
-- TOC entry 3962 (class 1259 OID 32880)
-- Name: idx_document_collection_document_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_collection_document_type ON public.document_collection USING btree (document_type);


--
-- TOC entry 3963 (class 1259 OID 32881)
-- Name: idx_document_collection_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_collection_due_date ON public.document_collection USING btree (due_date);


--
-- TOC entry 3964 (class 1259 OID 32878)
-- Name: idx_document_collection_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_collection_employee_id ON public.document_collection USING btree (employee_id);


--
-- TOC entry 3965 (class 1259 OID 32879)
-- Name: idx_document_collection_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_collection_status ON public.document_collection USING btree (status);


--
-- TOC entry 3970 (class 1259 OID 32882)
-- Name: idx_document_templates_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_document_templates_active ON public.document_templates USING btree (is_active);


--
-- TOC entry 4032 (class 1259 OID 33832)
-- Name: idx_documents_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_employee_id ON public.documents USING btree (employee_id);


--
-- TOC entry 4033 (class 1259 OID 33833)
-- Name: idx_documents_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_status ON public.documents USING btree (status);


--
-- TOC entry 4034 (class 1259 OID 33834)
-- Name: idx_documents_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_type ON public.documents USING btree (document_type);


--
-- TOC entry 3930 (class 1259 OID 24843)
-- Name: idx_employee_documents_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_documents_category ON public.employee_documents USING btree (document_category);


--
-- TOC entry 3931 (class 1259 OID 24841)
-- Name: idx_employee_documents_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_documents_employee_id ON public.employee_documents USING btree (employee_id);


--
-- TOC entry 3932 (class 1259 OID 24842)
-- Name: idx_employee_documents_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_documents_type ON public.employee_documents USING btree (document_type);


--
-- TOC entry 3863 (class 1259 OID 24753)
-- Name: idx_employee_forms_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_forms_employee_id ON public.employee_forms USING btree (employee_id);


--
-- TOC entry 3864 (class 1259 OID 24754)
-- Name: idx_employee_forms_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_forms_status ON public.employee_forms USING btree (status);


--
-- TOC entry 3879 (class 1259 OID 33827)
-- Name: idx_employee_master_company_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_master_company_email ON public.employee_master USING btree (company_email);


--
-- TOC entry 3880 (class 1259 OID 24822)
-- Name: idx_employee_master_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_master_department_id ON public.employee_master USING btree (department_id);


--
-- TOC entry 3881 (class 1259 OID 24757)
-- Name: idx_employee_master_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_master_employee_id ON public.employee_master USING btree (employee_id);


--
-- TOC entry 3882 (class 1259 OID 24758)
-- Name: idx_employee_master_manager_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_master_manager_id ON public.employee_master USING btree (manager_id);


--
-- TOC entry 3883 (class 1259 OID 33828)
-- Name: idx_employee_master_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_master_status ON public.employee_master USING btree (status);


--
-- TOC entry 3959 (class 1259 OID 32844)
-- Name: idx_expense_attachments_expense_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expense_attachments_expense_id ON public.expense_attachments USING btree (expense_id);


--
-- TOC entry 4027 (class 1259 OID 33831)
-- Name: idx_expense_requests_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expense_requests_date ON public.expense_requests USING btree (expense_date);


--
-- TOC entry 4028 (class 1259 OID 33829)
-- Name: idx_expense_requests_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expense_requests_employee_id ON public.expense_requests USING btree (employee_id);


--
-- TOC entry 4029 (class 1259 OID 33830)
-- Name: idx_expense_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expense_requests_status ON public.expense_requests USING btree (status);


--
-- TOC entry 3949 (class 1259 OID 32841)
-- Name: idx_expenses_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_category ON public.expenses USING btree (expense_category);


--
-- TOC entry 3950 (class 1259 OID 32843)
-- Name: idx_expenses_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_client ON public.expenses USING btree (client_code);


--
-- TOC entry 3951 (class 1259 OID 32797)
-- Name: idx_expenses_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_employee_id ON public.expenses USING btree (employee_id);


--
-- TOC entry 3952 (class 1259 OID 32800)
-- Name: idx_expenses_expense_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_expense_date ON public.expenses USING btree (expense_date);


--
-- TOC entry 3953 (class 1259 OID 32801)
-- Name: idx_expenses_hr_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_hr_id ON public.expenses USING btree (hr_id);


--
-- TOC entry 3954 (class 1259 OID 32842)
-- Name: idx_expenses_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_project ON public.expenses USING btree (project_reference);


--
-- TOC entry 3955 (class 1259 OID 32799)
-- Name: idx_expenses_series; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_series ON public.expenses USING btree (series);


--
-- TOC entry 3956 (class 1259 OID 32798)
-- Name: idx_expenses_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_status ON public.expenses USING btree (status);


--
-- TOC entry 4007 (class 1259 OID 33123)
-- Name: idx_full_time_employees_email; Type: INDEX; Schema: public; Owner: stalin_j
--

CREATE INDEX idx_full_time_employees_email ON public.full_time_employees USING btree (email);


--
-- TOC entry 4008 (class 1259 OID 33122)
-- Name: idx_full_time_employees_employee_id; Type: INDEX; Schema: public; Owner: stalin_j
--

CREATE INDEX idx_full_time_employees_employee_id ON public.full_time_employees USING btree (employee_id);


--
-- TOC entry 3993 (class 1259 OID 33121)
-- Name: idx_interns_email; Type: INDEX; Schema: public; Owner: stalin_j
--

CREATE INDEX idx_interns_email ON public.interns USING btree (email);


--
-- TOC entry 3994 (class 1259 OID 33120)
-- Name: idx_interns_intern_id; Type: INDEX; Schema: public; Owner: stalin_j
--

CREATE INDEX idx_interns_intern_id ON public.interns USING btree (intern_id);


--
-- TOC entry 3912 (class 1259 OID 37240)
-- Name: idx_leave_balances_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_balances_employee_id ON public.leave_balances USING btree (employee_id);


--
-- TOC entry 3913 (class 1259 OID 24767)
-- Name: idx_leave_balances_employee_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_balances_employee_year ON public.leave_balances USING btree (employee_id, year);


--
-- TOC entry 3899 (class 1259 OID 24766)
-- Name: idx_leave_requests_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_dates ON public.leave_requests USING btree (from_date, to_date);


--
-- TOC entry 3900 (class 1259 OID 24762)
-- Name: idx_leave_requests_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_employee_id ON public.leave_requests USING btree (employee_id);


--
-- TOC entry 3901 (class 1259 OID 24765)
-- Name: idx_leave_requests_hr_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_hr_id ON public.leave_requests USING btree (hr_id);


--
-- TOC entry 3902 (class 1259 OID 24763)
-- Name: idx_leave_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_status ON public.leave_requests USING btree (status);


--
-- TOC entry 3976 (class 1259 OID 32915)
-- Name: idx_leave_type_balances_employee_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_type_balances_employee_year ON public.leave_type_balances USING btree (employee_id, year);


--
-- TOC entry 3977 (class 1259 OID 32916)
-- Name: idx_leave_type_balances_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_type_balances_type ON public.leave_type_balances USING btree (leave_type);


--
-- TOC entry 3907 (class 1259 OID 24823)
-- Name: idx_leave_types_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_types_active ON public.leave_types USING btree (is_active);


--
-- TOC entry 3982 (class 1259 OID 33754)
-- Name: idx_manager_employee_mapping_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manager_employee_mapping_active ON public.manager_employee_mapping USING btree (is_active);


--
-- TOC entry 3983 (class 1259 OID 33753)
-- Name: idx_manager_employee_mapping_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manager_employee_mapping_employee ON public.manager_employee_mapping USING btree (employee_id);


--
-- TOC entry 3984 (class 1259 OID 33752)
-- Name: idx_manager_employee_mapping_manager; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_manager_employee_mapping_manager ON public.manager_employee_mapping USING btree (manager_id);


--
-- TOC entry 3884 (class 1259 OID 24759)
-- Name: idx_managers_manager_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_managers_manager_id ON public.managers USING btree (manager_id);


--
-- TOC entry 3971 (class 1259 OID 32914)
-- Name: idx_monthly_leave_accruals_employee_year_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_monthly_leave_accruals_employee_year_month ON public.monthly_leave_accruals USING btree (employee_id, year, month);


--
-- TOC entry 3865 (class 1259 OID 24756)
-- Name: idx_onboarded_employees_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_onboarded_employees_status ON public.onboarded_employees USING btree (status);


--
-- TOC entry 3866 (class 1259 OID 24755)
-- Name: idx_onboarded_employees_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_onboarded_employees_user_id ON public.onboarded_employees USING btree (user_id);


--
-- TOC entry 3852 (class 1259 OID 24751)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 3853 (class 1259 OID 33154)
-- Name: idx_users_email_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email_role ON public.users USING btree (email, role);


--
-- TOC entry 3854 (class 1259 OID 33520)
-- Name: idx_users_is_first_login; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_is_first_login ON public.users USING btree (is_first_login);


--
-- TOC entry 3855 (class 1259 OID 24752)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 3856 (class 1259 OID 33521)
-- Name: idx_users_role_first_login; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role_first_login ON public.users USING btree (role, is_first_login);


--
-- TOC entry 4068 (class 2620 OID 33024)
-- Name: employee_master trigger_employee_master_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_employee_master_delete AFTER DELETE ON public.employee_master FOR EACH ROW EXECUTE FUNCTION public.trigger_delete_employee_data();


--
-- TOC entry 4069 (class 2620 OID 33747)
-- Name: employee_documents trigger_update_document_collection; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_document_collection AFTER INSERT OR UPDATE ON public.employee_documents FOR EACH ROW EXECUTE FUNCTION public.update_document_collection_status();


--
-- TOC entry 4045 (class 2606 OID 24683)
-- Name: attendance attendance_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- TOC entry 4052 (class 2606 OID 24858)
-- Name: comp_off_balances comp_off_balances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comp_off_balances
    ADD CONSTRAINT comp_off_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4053 (class 2606 OID 24886)
-- Name: company_emails company_emails_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_emails
    ADD CONSTRAINT company_emails_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.managers(manager_id) ON DELETE CASCADE;


--
-- TOC entry 4054 (class 2606 OID 24881)
-- Name: company_emails company_emails_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_emails
    ADD CONSTRAINT company_emails_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4050 (class 2606 OID 24809)
-- Name: departments departments_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4058 (class 2606 OID 32858)
-- Name: document_collection document_collection_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_collection
    ADD CONSTRAINT document_collection_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4065 (class 2606 OID 33812)
-- Name: documents documents_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4066 (class 2606 OID 33822)
-- Name: documents documents_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- TOC entry 4067 (class 2606 OID 33817)
-- Name: documents documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- TOC entry 4051 (class 2606 OID 24836)
-- Name: employee_documents employee_documents_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT employee_documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4039 (class 2606 OID 24603)
-- Name: employee_forms employee_forms_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_forms
    ADD CONSTRAINT employee_forms_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- TOC entry 4040 (class 2606 OID 24608)
-- Name: employee_forms employee_forms_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_forms
    ADD CONSTRAINT employee_forms_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- TOC entry 4043 (class 2606 OID 24814)
-- Name: employee_master employee_master_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_master
    ADD CONSTRAINT employee_master_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- TOC entry 4061 (class 2606 OID 33730)
-- Name: employee_notifications employee_notifications_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_notifications
    ADD CONSTRAINT employee_notifications_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4057 (class 2606 OID 32812)
-- Name: expense_attachments expense_attachments_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_attachments
    ADD CONSTRAINT expense_attachments_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE;


--
-- TOC entry 4062 (class 2606 OID 33794)
-- Name: expense_requests expense_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_requests
    ADD CONSTRAINT expense_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- TOC entry 4063 (class 2606 OID 33789)
-- Name: expense_requests expense_requests_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_requests
    ADD CONSTRAINT expense_requests_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id);


--
-- TOC entry 4064 (class 2606 OID 33784)
-- Name: expense_requests expense_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_requests
    ADD CONSTRAINT expense_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4055 (class 2606 OID 32787)
-- Name: expenses expenses_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4056 (class 2606 OID 32792)
-- Name: expenses expenses_hr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_hr_id_fkey FOREIGN KEY (hr_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4049 (class 2606 OID 24746)
-- Name: leave_balances leave_balances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4046 (class 2606 OID 33147)
-- Name: leave_requests leave_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- TOC entry 4047 (class 2606 OID 24703)
-- Name: leave_requests leave_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4048 (class 2606 OID 24713)
-- Name: leave_requests leave_requests_hr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_hr_id_fkey FOREIGN KEY (hr_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4059 (class 2606 OID 33049)
-- Name: manager_employee_mapping manager_employee_mapping_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_employee_mapping
    ADD CONSTRAINT manager_employee_mapping_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- TOC entry 4060 (class 2606 OID 33044)
-- Name: manager_employee_mapping manager_employee_mapping_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manager_employee_mapping
    ADD CONSTRAINT manager_employee_mapping_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- TOC entry 4044 (class 2606 OID 37241)
-- Name: managers managers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4041 (class 2606 OID 24633)
-- Name: onboarded_employees onboarded_employees_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarded_employees
    ADD CONSTRAINT onboarded_employees_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- TOC entry 4042 (class 2606 OID 24628)
-- Name: onboarded_employees onboarded_employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarded_employees
    ADD CONSTRAINT onboarded_employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


-- Completed on 2025-09-08 12:43:39 IST

--
-- PostgreSQL database dump complete
--

