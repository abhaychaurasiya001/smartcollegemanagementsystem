import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateRequest {
  studentName: string;
  enrollmentNo: string;
  department: string;
  semester: string;
  professor: string;
  applicationType: string;
  subject: string;
  reason: string;
}

const applicationTemplates: Record<string, (data: GenerateRequest) => string> = {
  leave_request: (data) => `To,
${data.professor}
${data.department}
Subject: Application for Leave of Absence

Respected Sir/Madam,

I, ${data.studentName}, a student of ${data.department}, Semester ${data.semester}, bearing Enrollment Number ${data.enrollmentNo}, hereby submit my request for leave of absence.

${generateFormalReason(data.reason)}

I kindly request you to grant me leave for the mentioned period. I assure you that I will cover up the missed lectures and complete all pending assignments during this period.

Thank you for your consideration.

Yours faithfully,
${data.studentName}
Enrollment No: ${data.enrollmentNo}
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,

  assignment_extension: (data) => `To,
${data.professor}
${data.subject}
${data.department}

Subject: Request for Assignment Extension

Respected Sir/Madam,

I, ${data.studentName}, enrolled in ${data.subject}, Semester ${data.semester}, with Enrollment Number ${data.enrollmentNo}, am writing to request an extension for the submission of the assignment.

${generateFormalReason(data.reason)}

I would be grateful if you could grant me an extension for the assignment submission. I assure you that the work will be completed with the expected quality and dedication.

Thank you for your time and consideration.

Respectfully,
${data.studentName}
Enrollment No: ${data.enrollmentNo}
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,

  project_approval: (data) => `To,
${data.professor}
${data.department}

Subject: Request for Project Approval

Respected Sir/Madam,

I, ${data.studentName}, a student of ${data.department}, Semester ${data.semester}, bearing Enrollment Number ${data.enrollmentNo}, am writing to seek your approval for the project proposal.

${generateFormalReason(data.reason)}

I would be honored to receive your guidance and approval for this project. I have attached the detailed project proposal for your review.

Looking forward to your positive response.

Respectfully,
${data.studentName}
Enrollment No: ${data.enrollmentNo}
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,

  internship_permission: (data) => `To,
The Head of Department
${data.department}

Subject: Request for Internship Permission

Respected Sir/Madam,

I, ${data.studentName}, a student of ${data.department}, Semester ${data.semester}, bearing Enrollment Number ${data.enrollmentNo}, am writing to seek permission to pursue an internship opportunity.

${generateFormalReason(data.reason)}

I kindly request your approval to undertake this internship program, which would greatly enhance my practical knowledge and professional skills.

Thank you for considering my request.

Respectfully,
${data.studentName}
Enrollment No: ${data.enrollmentNo}
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,

  bonafide_certificate: (data) => `To,
The Principal/Administrator
[College Name]

Subject: Application for Bonafide Certificate

Respected Sir/Madam,

I, ${data.studentName}, a student of ${data.department}, Semester ${data.semester}, bearing Enrollment Number ${data.enrollmentNo}, hereby request the issuance of a Bonafide Certificate.

${generateFormalReason(data.reason)}

I kindly request you to issue the Bonafide Certificate at the earliest convenience as it is urgently required for the stated purpose.

Thank you for your assistance.

Yours faithfully,
${data.studentName}
Enrollment No: ${data.enrollmentNo}
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,

  scholarship_request: (data) => `To,
The Scholarship Committee
${data.department}

Subject: Application for Scholarship

Respected Sir/Madam,

I, ${data.studentName}, a student of ${data.department}, Semester ${data.semester}, bearing Enrollment Number ${data.enrollmentNo}, am writing to apply for the scholarship program.

${generateFormalReason(data.reason)}

I humbly request you to consider my application for the scholarship. I am committed to academic excellence and assure you that this support will be utilized effectively for my educational pursuits.

Thank you for your consideration.

Respectfully,
${data.studentName}
Enrollment No: ${data.enrollmentNo}
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,

  exam_rejoin: (data) => `To,
${data.professor}
${data.subject}
${data.department}

Subject: Request for Examination Rejoin

Respected Sir/Madam,

I, ${data.studentName}, a student of ${data.subject}, Semester ${data.semester}, bearing Enrollment Number ${data.enrollmentNo}, am writing to request permission to rejoin the examination.

${generateFormalReason(data.reason)}

I earnestly request you to consider my situation and grant me permission to appear for the examination. I have prepared thoroughly and am committed to my academic responsibilities.

Thank you for your kind consideration.

Respectfully,
${data.studentName}
Enrollment No: ${data.enrollmentNo}
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,

  attendance_regularization: (data) => `To,
${data.professor}
${data.subject}
${data.department}

Subject: Application for Attendance Regularization

Respected Sir/Madam,

I, ${data.studentName}, a student of ${data.subject}, Semester ${data.semester}, bearing Enrollment Number ${data.enrollmentNo}, am writing to request regularization of my attendance.

${generateFormalReason(data.reason)}

I kindly request your consideration in regularizing my attendance for the mentioned period. I assure you of my regular presence in all future classes.

Thank you for your understanding.

Respectfully,
${data.studentName}
Enrollment No: ${data.enrollmentNo}
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,

  general_request: (data) => `To,
${data.professor}
${data.department}

Subject: ${data.subject || 'General Application'}

Respected Sir/Madam,

I, ${data.studentName}, a student of ${data.department}, Semester ${data.semester}, bearing Enrollment Number ${data.enrollmentNo}, am writing to submit my request.

${generateFormalReason(data.reason)}

I kindly request your attention to this matter and would be grateful for your guidance and support.

Thank you for your time and consideration.

Respectfully,
${data.studentName}
Enrollment No: ${data.enrollmentNo}
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
};

function generateFormalReason(reason: string): string {
  // Clean and formalize the reason
  let formalReason = reason.trim();

  // Capitalize first letter
  formalReason = formalReason.charAt(0).toUpperCase() + formalReason.slice(1);

  // Add period if not present
  if (!formalReason.endsWith('.')) {
    formalReason += '.';
  }

  // Generate formal statement
  const statements = [
    `The reason for this request is as follows: ${formalReason}`,
    `I am writing to inform you that ${formalReason.toLowerCase()}`,
    `This is to bring to your kind attention that ${formalReason.toLowerCase()}`,
  ];

  // Use the first statement as default (most formal)
  return statements[0];
}

// @ts-ignore Deno is provided by the Deno runtime
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: GenerateRequest = await req.json();

    // Validate required fields
    if (!data.studentName || !data.reason || !data.applicationType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the appropriate template
    const template = applicationTemplates[data.applicationType] || applicationTemplates.general_request;

    // Generate the application
    const generatedContent = template(data);

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        applicationType: data.applicationType,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
