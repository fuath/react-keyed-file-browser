import Moment from 'moment'
import { File } from "./Models";

function relativeTimeWindows() {
  const windows = [];
  const now = Moment();
  windows.push({
    begins: Moment().startOf("day"),
    ends: Moment().endOf("day"),
    items: [],
    name: "Today"
  });
  windows.push({
    name: "Yesterday",
    ends: Moment(
      windows[windows.length - 1].ends - Moment.duration(24, "hours")
    ),
    items: [],
    begins: Moment(
      windows[windows.length - 1].begins - Moment.duration(24, "hours")
    ),
  });
  windows.push({
    name: "Earlier this Week",
    begins: windows[0].begins.clone().startOf("week"),
    ends: windows[0].begins
      .clone()
      .startOf("week")
      .endOf("week"),
    items: []
  });
  windows.push({
    begins: Moment(windows[2].begins - Moment.duration(7, "days")),
    ends: Moment(windows[2].begins - Moment.duration(7, "days")).endOf("week"),
    items: [],
    name: "Last Week"
  });
  if (Moment(windows[windows.length - 1].begins).month() === now.month()) {
    windows.push({
      begins: Moment().startOf("month"),
      ends: Moment()
      .startOf("month")
      .endOf("month"),
      items: [],
      name: "Earlier this Month"
    });
  }
  return windows;
}

export function groupByModified(files: File[]) {
  const timeWindows = relativeTimeWindows();

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const file = files[fileIndex];
    if (!file.size) {
      continue;
    }
    const newFile: File = {
      ...file,
      keyDerived: true
    };

    let allocated = false;
    const fileModified = +Moment(newFile.modified);
    for (let windex = 0; windex < timeWindows.length; windex++) {
      const timeWindow = timeWindows[windex];
      if (
        fileModified > +timeWindow.begins &&
        fileModified <= +timeWindow.ends
      ) {
        timeWindow.items.push(newFile);
        allocated = true;
        break;
      }
    }
    if (!allocated) {
      const newWindow = {
        begins: Moment(newFile.modified).startOf("month"),
        ends: Moment(newFile.modified)
        .startOf("month")
        .endOf("month"),
        items: [],
        name: Moment(newFile.modified).format("MMMM YYYY")
      };
      newWindow.items.push(newFile);
      timeWindows.push(newWindow);
    }
  }

  const grouped = [];
  for (let windex = 0; windex < timeWindows.length; windex++) {
    const timeWindow = timeWindows[windex];
    if (!timeWindow.items.length) {
      continue;
    }
    grouped.push({
      children: timeWindow.items,
      key: timeWindow.name.toLowerCase().replace(" ", "_"),
      name: timeWindow.name,
      size: 0
    });
  }

  return grouped;
}

export interface Tree {
  children: Tree | object;
  contents: any[];
};

export function groupByFolder(files: File[], root: string) {
  const fileTree: Tree = {
    children: {},
    contents: []
  };

  files.map(file => {
    file.relativeKey = (file.newKey || file.key).substr(root.length);
    let currentFolder = fileTree;
    const folders = file.relativeKey.split("/");
    folders.map((folder, folderIndex) => {
      if (folderIndex === folders.length - 1 && !file.size) {
        for (const key in file) {
          if (key) {
            currentFolder[key] = file[key];
          }
        }
      }
      if (folder === "") {
        return;
      }
      const isAFile = file.size && folderIndex === folders.length - 1;
      if (isAFile) {
        currentFolder.contents.push({
          ...file,
          keyDerived: true
        });
      } else {
        if (folder in currentFolder.children === false) {
          currentFolder.children[folder] = {
            children: {},
            contents: []
          };
        }
        currentFolder = currentFolder.children[folder];
      }
    });
  });

  function addAllChildren(level: Tree, prefix: string): File[] {
    if (prefix !== "") {
      prefix += "/";
    }
    let ChildFiles: File[] = [];
    for (const folder in level.children) {
      if (folder) {
        ChildFiles.push({
          ...level.children[folder],
          children: addAllChildren(level.children[folder], prefix + folder),
          contents: undefined,
          key: root + prefix + folder + "/",
          keyDerived: true,
          relativeKey: prefix + folder + "/",
          size: 0
        });
      }
    }
    ChildFiles = ChildFiles.concat(level.contents);
    return ChildFiles;
  }

  files = addAllChildren(fileTree, "");
  return files;
}

export function floatPrecision(float: string | number, precision: number): string {
  const parsedFloat = parseFloat(String(float));
  const power = Math.pow(10, precision);
  return isNaN(parsedFloat) ? parseFloat("0").toFixed(precision)
                            : (Math.round(parsedFloat * power) / power).toFixed(precision);
}

export function fileSize(size: number) {
  if (size > 1024) {
    const kbSize = size / 1024;
    if (kbSize > 1024) {
      const mbSize = kbSize / 1024;
      return `${floatPrecision(mbSize, 2)} MB`;
    }
    return `${Math.round(kbSize)} kB`;
  }
  return `${size} B`;
}


function lastModifiedComparer(a: File, b: File) {
  return (+Moment(a.modified) < +Moment(b.modified))
}

export function lastModifiedSort(allFiles: File[]) {
  const folders = []
  let files = []
  for (let fileIndex = 0; fileIndex < allFiles.length; fileIndex++) {
    const file = allFiles[fileIndex]
    const keyFolders = (file.newKey || file.key).split('/')
    if (file.children) {
      // file.name = keyFolders[keyFolders.length - 2]
      folders.push(file)
    } else {
      file.name = keyFolders[keyFolders.length - 1]
      files.push(file)
    }
  }

  files = files.sort(lastModifiedComparer)

  for (let folderIndex = 0; folderIndex < folders.length; folderIndex++) {
    const folder = folders[folderIndex]
    folder.children = lastModifiedSort(folder.children)
  }

  let sortedFiles = []
  sortedFiles = sortedFiles.concat(folders)
  sortedFiles = sortedFiles.concat(files)
  return sortedFiles
}

function naturalSortComparer(a, b) {
  const NUMBER_GROUPS = /(-?\d*\.?\d+)/g;
  const aa = String(a.name).split(NUMBER_GROUPS)
  const bb = String(b.name).split(NUMBER_GROUPS)
  const min = Math.min(aa.length, bb.length)

  for (let i = 0; i < min; i++) {
    const x = parseFloat(aa[i]) || aa[i].toLowerCase()
    const y = parseFloat(bb[i]) || bb[i].toLowerCase()
    if (x < y) {
      return -1;
    } else if (x > y) {
      return 1;
    }
  }
  return 0;
}
function naturalDraftComparer(a, b) {
  if (a.draft && !b.draft) {
    return 1
  } else if (b.draft && !a.draft) {
    return -1
  }
  return naturalSortComparer(a, b)
}

export function naturalSort(allFiles: any[]) {
  let folders = []
  let files = []

  for (let fileIndex = 0; fileIndex < allFiles.length; fileIndex++) {
    const file = allFiles[fileIndex]
    const keyFolders = (file.newKey || file.key).split('/')
    if (file.children) {
      if (!file.name) {
        file.name = keyFolders[keyFolders.length - 2]
      }
      folders.push(file)
    } else {
      if (!file.name) {
        file.name = keyFolders[keyFolders.length - 1]
      }
      files.push(file)
    }
  }

  files = files.sort(naturalSortComparer)
  folders = folders.sort(naturalDraftComparer)

  for (let folderIndex = 0; folderIndex < folders.length; folderIndex++) {
    const folder = folders[folderIndex]
    folder.children = naturalSort(folder.children)
  }

  let sortedFiles = []
  sortedFiles = sortedFiles.concat(folders)
  sortedFiles = sortedFiles.concat(files)
  return sortedFiles;
}


