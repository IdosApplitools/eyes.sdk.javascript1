function amendPackagesList(packages) {
  return packages.map(pkg => {
    pkg.dependent_of = packages.filter(p => Object.keys(p.dependencies).includes(pkg.name)).map(p => p.name)
    return pkg
  })
}

function makeDependencyTree(packages = []) {
  let pkgs = amendPackagesList(packages)

  function findBranches(chunk, results = []) {
    if (!pkgs.length) return results
    let branchDeps, branchDepNames
    if (!chunk) {
      branchDeps = pkgs.filter(pkg => !pkg.dependent_of.length) // a.k.a. tip of tree
      branchDepNames = branchDeps.map(pkg => pkg.name)
    } else {
      const chunkDeps = [...new Set(chunk.map(pkg => Object.keys(pkg.dependencies)).flat())]
      branchDepNames = chunkDeps.filter(pkgName => {
        const pkg = pkgs.find(pkg => pkg.name === pkgName)
        if (!pkg) return
        return !pkg.dependent_of.some(dep_of => 
          chunkDeps.includes(dep_of)
        )
      })
      branchDeps = branchDepNames.map(depName => pkgs.find(pkg => pkg.name === depName))
    }
    results.push(branchDepNames)
    branchDepNames.forEach(name => {
      pkgs = pkgs.filter(pkg => pkg.name !== name)
    })
    return findBranches(branchDeps, results)
  }

  return findBranches().reverse()
}

module.exports = {
  makeDependencyTree
}
