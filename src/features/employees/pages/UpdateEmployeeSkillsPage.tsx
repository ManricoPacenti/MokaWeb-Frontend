import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getEmployeeById } from '../api/employeeService';
import { updateEmployeeSkills } from '../api/updateEmployeeSkills';
import type {
  EmployeeProficiency,
  EmployeeSkillName,
} from '../types/employeeTypes';

const SKILL_OPTIONS: EmployeeSkillName[] = [
  'BAR',
  'KITCHEN',
  'RESP',
  'RUNNER',
  'WAITER',
  'OPENING',
];

const PROFICIENCY_OPTIONS: EmployeeProficiency[] = ['LOW', 'MID', 'HIGH'];

type SkillFormItem = {
  skill: EmployeeSkillName | '';
  proficiency: EmployeeProficiency | '';
};

export default function UpdateEmployeeSkillsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const employeeId = Number(id);

  const [employeeName, setEmployeeName] = useState('');
  const [skills, setSkills] = useState<SkillFormItem[]>([
    {
      skill: '',
      proficiency: '',
    },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadEmployee() {
      if (!employeeId || Number.isNaN(employeeId)) {
        setError('Invalid employee ID.');
        setIsLoading(false);
        return;
      }

      try {
        const employee = await getEmployeeById(employeeId);

        setEmployeeName(`${employee.firstName} ${employee.lastName}`);

        if (employee.skills.length > 0) {
          setSkills(
            employee.skills.map((item) => ({
              skill: item.skill,
              proficiency: item.proficiency,
            })),
          );
        }
      } catch (error) {
        console.error('LOAD EMPLOYEE SKILLS ERROR:', error);
        setError('Unable to load employee skills.');
      } finally {
        setIsLoading(false);
      }
    }

    loadEmployee();
  }, [employeeId]);

  function handleChange(
    index: number,
    field: 'skill' | 'proficiency',
    value: EmployeeSkillName | EmployeeProficiency | '',
  ) {
    setSkills((previousSkills) =>
      previousSkills.map((item, currentIndex) =>
        currentIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addSkill() {
    setSkills((previousSkills) => [
      ...previousSkills,
      {
        skill: '',
        proficiency: '',
      },
    ]);
  }

  function removeSkill(index: number) {
    setSkills((previousSkills) =>
      previousSkills.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function validate(): string {
    if (!employeeId || Number.isNaN(employeeId)) {
      return 'Invalid employee ID.';
    }

    if (skills.length === 0) {
      return 'Please add at least one skill.';
    }

    for (const item of skills) {
      if (!item.skill) {
        return 'Please select a skill.';
      }

      if (!item.proficiency) {
        return 'Please select a proficiency.';
      }
    }

    return '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    const cleanedSkills = skills.map((item) => ({
      skill: item.skill as EmployeeSkillName,
      proficiency: item.proficiency as EmployeeProficiency,
    }));

    setError('');
    setIsSubmitting(true);

    try {
      await updateEmployeeSkills(employeeId, {
        skills: cleanedSkills,
      });

      navigate('/employees');
    } catch (error: any) {
      console.error('UPDATE SKILLS ERROR FULL:', error);
      console.error('STATUS:', error.response?.status);
      console.error('DATA:', error.response?.data);

      if (error.response?.status === 400) {
        setError('Invalid values. Please check skill and proficiency.');
      } else if (error.response?.status === 403) {
        setError('You are not allowed to update skills.');
      } else {
        setError('Unable to update employee skills.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="container py-5">
        <p>Loading skills...</p>
      </main>
    );
  }

  return (
    <main className="container py-5">
      <header className="mb-4">
        <h1>Update Skills</h1>
        <p className="text-muted mb-0">
          {employeeName
            ? `Configure operational skills for ${employeeName}.`
            : 'Configure operational skills for the selected employee.'}
        </p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
        {skills.map((item, index) => (
          <div key={index} className="border rounded p-3 mb-3">
            <div className="mb-3">
              <label className="form-label" htmlFor={`skill-${index}`}>
                Skill
              </label>

              <select
                id={`skill-${index}`}
                className="form-select"
                value={item.skill}
                onChange={(event) =>
                  handleChange(
                    index,
                    'skill',
                    event.target.value as EmployeeSkillName | '',
                  )
                }
              >
                <option value="">Select skill</option>

                {SKILL_OPTIONS.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor={`proficiency-${index}`}>
                Proficiency
              </label>

              <select
                id={`proficiency-${index}`}
                className="form-select"
                value={item.proficiency}
                onChange={(event) =>
                  handleChange(
                    index,
                    'proficiency',
                    event.target.value as EmployeeProficiency | '',
                  )
                }
              >
                <option value="">Select proficiency</option>

                {PROFICIENCY_OPTIONS.map((proficiency) => (
                  <option key={proficiency} value={proficiency}>
                    {proficiency}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => removeSkill(index)}
              disabled={skills.length === 1}
            >
              Remove
            </button>
          </div>
        ))}

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={addSkill}
          >
            + Add Skill
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Skills'}
          </button>
        </div>
      </form>
    </main>
  );
}