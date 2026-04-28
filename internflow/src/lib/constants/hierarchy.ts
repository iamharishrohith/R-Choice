export type DepartmentNode = {
  name: string;
};

export type CourseNode = {
  course: string;
  programType: "UG" | "PG";
  departments: DepartmentNode[];
};

export type SectionNode = {
  section: string;
  courses: CourseNode[];
};

export type SchoolNode = {
  school: string;
  sections: SectionNode[];
};

export const COLLEGE_HIERARCHY: SchoolNode[] = [
  {
    school: "School of Commerce",
    sections: [
      {
        section: "Commerce 1",
        courses: [
          {
            course: "B.Com",
            programType: "UG",
            departments: [
              { name: "Computer Applications (CA)" },
              { name: "Business Process Services (BPS)" }
            ]
          },
          {
            course: "M.Com",
            programType: "PG",
            departments: [
              { name: "Computer Applications (CA)" }
            ]
          }
        ]
      },
      {
        section: "Commerce 2",
        courses: [
          {
            course: "B.Com",
            programType: "UG",
            departments: [
              { name: "General" },
              { name: "Association of Chartered Certified Accountants (ACCA)" },
              { name: "Professional Accounting (PA)" }
            ]
          },
          {
            course: "M.Com",
            programType: "PG",
            departments: [
              { name: "General" }
            ]
          }
        ]
      },
      {
        section: "Commerce 3",
        courses: [
          {
            course: "B.Com",
            programType: "UG",
            departments: [
              { name: "Banking and Insurance (BI)" },
              { name: "Accounting and Finance (AF)" }
            ]
          }
        ]
      },
      {
        section: "Commerce 4",
        courses: [
          {
            course: "B.Com",
            programType: "UG",
            departments: [
              { name: "International Business (IB)" },
              { name: "Corporate Secretaryship (CS)" }
            ]
          }
        ]
      }
    ]
  },
  {
    school: "School of Computer Science",
    sections: [
      {
        section: "Rsmart 1",
        courses: [
          {
            course: "B.Sc",
            programType: "UG",
            departments: [
              { name: "Computer Science (CS)" },
              { name: "Computer Technology (CT) - Full Stack Development" },
              { name: "Computer Technology (CT) - Blockchain and Distributed Computing" },
              { name: "Computer Science with AI" }
            ]
          },
          {
            course: "M.Sc",
            programType: "PG",
            departments: [
              { name: "General" }
            ]
          }
        ]
      },
      {
        section: "Rsmart 2",
        courses: [
          {
            course: "B.Sc",
            programType: "UG",
            departments: [
              { name: "IT" },
              { name: "Digital Cyber Forensic Science" }
            ]
          },
          {
            course: "BCA",
            programType: "UG",
            departments: [
              { name: "BCA Devops" }
            ]
          },
          {
            course: "M.Sc",
            programType: "PG",
            departments: [
              { name: "IT" }
            ]
          }
        ]
      },
      {
        section: "Rsmart 3",
        courses: [
          {
            course: "B.Sc",
            programType: "UG",
            departments: [
              { name: "AIML" },
              { name: "Computer Science with Data Science" },
              { name: "Data Science and Analytics" }
            ]
          },
          {
            course: "M.Sc",
            programType: "PG",
            departments: [
              { name: "Data Science and Business Analytics" }
            ]
          }
        ]
      },
      {
        section: "Rsmart Pro",
        courses: [
          {
            course: "B.Sc",
            programType: "UG",
            departments: [
              { name: "Computer Science with AI Intel" },
              { name: "IT with Data Science" },
              { name: "AI with Data Science" },
              { name: "Computer Science with Cyber Security" }
            ]
          },
          {
            course: "M.Sc",
            programType: "PG",
            departments: [
              { name: "General" }
            ]
          }
        ]
      }
    ]
  },
  {
    school: "School of Science",
    sections: [
      {
        section: "Dept of Maths",
        courses: [
          {
            course: "B.Sc",
            programType: "UG",
            departments: [
              { name: "Maths" }
            ]
          },
          {
            course: "M.Sc",
            programType: "PG",
            departments: [
              { name: "Maths" }
            ]
          }
        ]
      },
      {
        section: "Dept of Physics",
        courses: [
          {
            course: "B.Sc",
            programType: "UG",
            departments: [
              { name: "Physics" }
            ]
          }
        ]
      },
      {
        section: "Dept of Psychology",
        courses: [
          {
            course: "B.Sc",
            programType: "UG",
            departments: [
              { name: "Psychology" }
            ]
          },
          {
            course: "M.Sc",
            programType: "PG",
            departments: [
              { name: "Applied Psychology" },
              { name: "Clinical Psychology" }
            ]
          }
        ]
      },
      {
        section: "Dept of Bio Science",
        courses: [
          {
            course: "B.Sc",
            programType: "UG",
            departments: [
              { name: "Bio Technology" },
              { name: "Microbiology" }
            ]
          }
        ]
      }
    ]
  },
  {
    school: "School of Fine Arts",
    sections: [
      {
        section: "Dept of English",
        courses: [
          {
            course: "BA",
            programType: "UG",
            departments: [
              { name: "English Literature" }
            ]
          },
          {
            course: "MA",
            programType: "PG",
            departments: [
              { name: "English Literature" }
            ]
          }
        ]
      },
      {
        section: "Dept of Costume Design Fashion",
        courses: [
          {
            course: "B.Sc",
            programType: "UG",
            departments: [
              { name: "Costume Design Fashion" }
            ]
          }
        ]
      },
      {
        section: "Dept of Visual Communication",
        courses: [
          {
            course: "B.Sc",
            programType: "UG",
            departments: [
              { name: "Visual Communication (Electronic Media)" },
              { name: "Visual Communication (VFX)" }
            ]
          },
          {
            course: "MA",
            programType: "PG",
            departments: [
              { name: "Journalism and Mass Communication" }
            ]
          }
        ]
      },
      {
        section: "Dept of Management",
        courses: [
          {
            course: "BBA",
            programType: "UG",
            departments: [
              { name: "Computer Applications (CA)" },
              { name: "Logistics" },
              { name: "Aviation Management" }
            ]
          },
          {
            course: "MBA",
            programType: "PG",
            departments: [
              { name: "Innovation Entrepreneurship and Venture Development" },
              { name: "International Business" }
            ]
          },
          {
            course: "B.Com",
            programType: "UG",
            departments: [
              { name: "Financial Services" },
              { name: "IT" }
            ]
          }
        ]
      }
    ]
  }
];

export const YEARS = [1, 2, 3, 4, 5];
