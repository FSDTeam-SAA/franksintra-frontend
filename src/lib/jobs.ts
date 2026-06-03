import { AxiosError } from "axios";

import { axiosInstance } from "@/lib/axios";

export type JobStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

export type JobHistoryItem = {
  _id: string;
  originalFilename: string;
  originalCloudinaryUrl: string;
  status: JobStatus;
  aiSessionId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobRecord = JobHistoryItem & {
  imageHash?: string;
  aiRawResponse?: string | null;
  failureReason?: string | null;
  chatHistory?: Array<{
    role: "user" | "assistant";
    update_field_name: string;
    user_instruction: string;
    ai_response: string | null;
    createdAt: string;
  }>;
};

export type JobsHistoryResponse = {
  jobs: JobHistoryItem[];
  paginationInfo?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type UploadJobResponse = {
  jobId: string;
  status: JobStatus;
};

export type RefineJobResponse = {
  jobId: string;
  update_field_name: string;
  ai_response: string;
  chatHistory: NonNullable<JobRecord["chatHistory"]>;
};

export type DeleteJobResponse = {
  message: string;
  data: null;
};

export type ParsedAiContent = {
  fileName: string;
  title: string;
  caption: string;
  keywords: string[];
  description: string;
  location: string;
  gmbPost: string;
  rawResponse: string;
};

type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

export function normalizeAiText(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    try {
      return normalizeAiText(JSON.parse(value));
    } catch {
      return value.trim();
    }
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeAiText).filter(Boolean).join("\n").trim();
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferredKeys = [
      "ai_response",
      "aiResponse",
      "response",
      "content",
      "text",
      "message",
      "post",
      "description",
      "caption",
      "keywords",
      "filename",
    ];

    for (const key of preferredKeys) {
      const candidate = record[key];
      const normalized = normalizeAiText(candidate);
      if (normalized) {
        return normalized;
      }
    }

    return Object.values(record)
      .map(normalizeAiText)
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeAiText(item))
      .filter(Boolean);
  }

  const normalized = normalizeAiText(value);
  return normalized ? [normalized] : [];
}

export function parseAiGeneratedContent(
  value: unknown,
): ParsedAiContent | null {
  if (value == null) {
    return null;
  }

  const parsedValue =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            return null;
          }
        })()
      : value;

  const record =
    parsedValue && typeof parsedValue === "object"
      ? (parsedValue as Record<string, unknown>)
      : null;

  if (!record) {
    return null;
  }

  const responseRecord =
    record.response && typeof record.response === "object"
      ? (record.response as Record<string, unknown>)
      : record;

  const title = normalizeAiText(responseRecord.title);
  const caption = normalizeAiText(responseRecord.caption);
  const description = normalizeAiText(responseRecord.description);
  const gmbPost = normalizeAiText(responseRecord.gmb_post);
  const fileName = normalizeAiText(
    responseRecord.file_name ?? responseRecord.filename,
  );
  const location = normalizeAiText(
    responseRecord.assign_location ?? responseRecord.location,
  );
  const keywords = toStringArray(
    responseRecord.SEO_keywords ?? responseRecord.seo_keywords,
  );

  const hasMeaningfulContent =
    Boolean(title) ||
    Boolean(caption) ||
    keywords.length > 0 ||
    Boolean(description) ||
    Boolean(gmbPost) ||
    Boolean(fileName);

  if (!hasMeaningfulContent) {
    return null;
  }

  return {
    fileName,
    title,
    caption,
    keywords,
    description,
    location,
    gmbPost,
    rawResponse: typeof value === "string" ? value : JSON.stringify(value),
  };
}

export function formatAiContentForCopy(content: ParsedAiContent): string {
  const sections = [
    content.title && `Title: ${content.title}`,
    content.caption && `Caption: ${content.caption}`,
    content.keywords.length > 0 &&
      `SEO Keywords: ${content.keywords.join(", ")}`,
    content.description && `Description: ${content.description}`,
    content.location && `Location: ${content.location}`,
    content.gmbPost && `Post Body:\n${content.gmbPost}`,
  ].filter(Boolean);

  return sections.join("\n\n");
}

function unwrap<T>(payload: ApiEnvelope<T>): T {
  return payload.data;
}

export async function uploadJob(image: File): Promise<UploadJobResponse> {
  const formData = new FormData();
  formData.append("image", image);

  const response = await axiosInstance.post<ApiEnvelope<UploadJobResponse>>(
    "/jobs/upload",
    formData,
  );

  return unwrap(response.data);
}

export async function getJob(jobId: string): Promise<JobRecord> {
  const response = await axiosInstance.get<ApiEnvelope<JobRecord>>(`/jobs/${jobId}`);
  return unwrap(response.data);
}

export async function getJobsHistory(page = 1, limit = 8): Promise<JobsHistoryResponse> {
  const response = await axiosInstance.get<ApiEnvelope<JobsHistoryResponse>>(
    "/jobs/history",
    {
      params: { page, limit },
    },
  );

  return unwrap(response.data);
}

export async function refineJob(params: {
  jobId: string;
  update_field_name: string;
  user_instruction: string;
}): Promise<RefineJobResponse> {
  const response = await axiosInstance.post<ApiEnvelope<RefineJobResponse>>(
    `/jobs/${params.jobId}/chat`,
    {
      update_field_name: params.update_field_name,
      user_instruction: params.user_instruction,
    },
  );

  return unwrap(response.data);
}

export async function deleteJob(jobId: string): Promise<DeleteJobResponse> {
  const response = await axiosInstance.delete<ApiEnvelope<DeleteJobResponse>>(
    `/jobs/${jobId}`,
  );

  return unwrap(response.data);
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

export function getDuplicateJobId(error: unknown): string | null {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { existingJobId?: string; data?: { existingJobId?: string } }
      | undefined;

    return data?.existingJobId ?? data?.data?.existingJobId ?? null;
  }

  return null;
}
