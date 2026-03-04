import { PendingTokens } from '../../components/nurse/PendingTokens';
import { SectionHeader } from '../../components/shared';
export default function NurseTokensPage() {
  return (<div><SectionHeader title="Nurse Dashboard" subtitle="Medicine dispensing portal" /><PendingTokens /></div>);
}