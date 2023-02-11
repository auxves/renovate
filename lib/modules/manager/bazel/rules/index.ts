import { z } from 'zod';
import { regEx } from '../../../../util/regex';
import type { PackageDependency } from '../../types';
import type { Fragment, FragmentData, Target } from '../types';
import { DockerTarget, dockerRules } from './docker';
import { GitTarget, gitRules } from './git';
import { GoTarget, goRules } from './go';
import { HttpTarget, httpRules } from './http';

const Target = z.union([DockerTarget, GitTarget, GoTarget, HttpTarget]);

/**
 * Gather all rule names supported by Renovate in order to speed up parsing
 * by filtering out other syntactically correct rules we don't support yet.
 */
const supportedRules = [...dockerRules, ...gitRules, ...goRules, ...httpRules];
export const supportedRulesRegex = regEx(`^${supportedRules.join('|')}$`);

export function extractDepsFromFragmentData(
  fragmentData: FragmentData
): PackageDependency[] {
  const res = Target.safeParse(fragmentData);
  if (!res.success) {
    return [];
  }
  return res.data;
}

export function extractDepsFromFragment(
  fragment: Fragment
): PackageDependency[] {
  const fragmentData = extract(fragment);
  return extractDepsFromFragmentData(fragmentData);
}

export function extract(fragment: Fragment): FragmentData {
  if (fragment.type === 'string') {
    return fragment.value;
  }

  if (fragment.type === 'record') {
    const { children } = fragment;
    const result: Record<string, FragmentData> = {};
    for (const [key, value] of Object.entries(children)) {
      result[key] = extract(value);
    }
    return result;
  }

  return fragment.children.map(extract);
}
