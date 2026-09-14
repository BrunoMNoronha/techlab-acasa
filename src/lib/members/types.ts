export type PersonType = "PF" | "PJ";

export interface MembershipCategory {
  code: string;
  name: string;
}

export interface Member {
  id: string;
  person_type: PersonType;
  name: string;
  membership_category_code: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberInput {
  person_type: PersonType;
  name: string;
  membership_category_code: string;
  email: string | null;
  phone: string | null;
}

export type MemberFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof MemberInput, string>>;
  memberId?: string;
};

export interface MemberListParams {
  q?: string;
  personType?: PersonType;
  category?: string;
  page?: number;
}

export interface PaginatedMembersResult {
  items: Member[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
