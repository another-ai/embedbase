from setuptools import setup, find_packages

if __name__ == "__main__":

    # https://github.com/mautrix/telegram/blob/master/setup.py
    with open("optional-requirements.txt") as reqs:
        extras_require = {}
        current = []
        for line in reqs.read().splitlines():
            if line.startswith("#/"):
                extras_require[line[2:]] = current = []
            elif not line or line.startswith("#"):
                continue
            else:
                current.append(line)

    extras_require["all"] = list({dep for deps in extras_require.values() for dep in deps})

    # same for requirements.txt
    with open("requirements.txt") as reqs:
        install_requires = [line for line in reqs.read().splitlines() if not line.startswith("#")]


    setup(
        name="embedbase",
        packages=find_packages(),
        include_package_data=True,
        version="0.7.9",
        description="Open-source API for to easily create, store, and retrieve embeddings",
        install_requires=install_requires,
        extras_require=extras_require,
        classifiers=[
            "Development Status :: 4 - Beta",
            "Intended Audience :: Developers",
            "Topic :: Scientific/Engineering :: Artificial Intelligence",
            "License :: OSI Approved :: MIT License",
            "Programming Language :: Python :: 3.10",
        ],
    )