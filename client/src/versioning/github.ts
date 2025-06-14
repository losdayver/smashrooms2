const githubApiBaseURL = "https://api.github.com/repos/losdayver/smashrooms2/";
const githubBaseURL = "https://github.com/losdayver/smashrooms2/";

export interface ILastCommitInfo {
  message: string;
  date: Date;
}
export const getLastCommitInfo = async (): Promise<ILastCommitInfo | false> => {
  const json = await fetch(
    githubApiBaseURL + "commits?sha=master&per_page=1"
  ).then((res) => res.json());
  const lastCommit = json?.[0];
  if (!lastCommit) return false;
  return {
    message: lastCommit.commit.message,
    date: new Date(lastCommit.commit.committer.date),
  } as ILastCommitInfo;
};

export const commitInfoToHtml = (info: ILastCommitInfo) => {
  let msg = info.message.split("\n")[0];
  const d = info.date;
  const match = /\(#(\d+)\)/g.exec(msg)?.[0];
  const pullNum = match.replace("(#", "").replace(")", "");
  if (match)
    msg = msg.replace(
      match,
      `<a target="_blank" href="${
        githubBaseURL + "pull/" + pullNum
      }">${match}</a>`
    );
  return `${msg} ${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate()}`;
};
