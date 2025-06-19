#!/usr/bin/env python3
"""
Setup script for Odoo XML-RPC MCP Server
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="odoo-xmlrpc-mcp-server",
    version="1.0.0", 
    author="XML-RPC Odoo MCP Team",
    author_email="",
    description="MCP Server for Odoo XML-RPC integration",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/v-odoo-testing/xml-rpc-odoo-mcp",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=[
        "mcp>=1.0.0",
    ],
    entry_points={
        "console_scripts": [
            "odoo-xmlrpc-mcp-server=server:main",
        ],
    },
    py_modules=["server", "_config"],
)