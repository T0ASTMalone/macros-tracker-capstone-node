function makeFolders() {
  return [
    {
      id: 1,
      folder_name: 'test folder 1'
    },
    {
      id: 2,
      folder_name: 'test folder 2'
    },
    {
      id: 3,
      folder_name: 'test folder 3'
    },
    {
      id: 4,
      folder_name: 'test folder 4'
    },
    {
      id: 5,
      folder_name: 'test folder 5'
    }
  ];
}

function makeMaliciousFolders() {
  const maliciousFolders = [
    {
      id: 1,
      folder_name: 'Naughty naughty very naughty <script>alert("xss");</script>'
    }
  ];
  const expectedFolders = {
    id: 1,
    folder_name:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;'
  };
  return { maliciousFolders, expectedFolders };
}

module.exports = { makeFolders, makeMaliciousFolders };
