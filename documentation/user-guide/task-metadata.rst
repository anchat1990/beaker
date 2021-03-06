Task metadata
=============

This section describes the metadata which must be defined in each Beaker task. 
The beaker-wizard utility will help you to populate this metadata correctly 
when creating a new task (see :doc:`An example task <example-task>`). A sample 
Makefile is also included in the ``rhts-devel`` package as 
``/usr/share/doc/rhts-devel-*/Makefile.template``.

These details apply to tasks written using the default harness (``beah``).
Programs written using an :ref:`alternative harness <alternative-harnesses>`
will likely be configured differently — consult the documentation for the
specific harness in use.

.. _makefile-variables:

Makefile variables
~~~~~~~~~~~~~~~~~~

The following environment variables must be exported in the task's Makefile. 
These variables are used by ``rhts-make.include`` and its ancillary scripts 
when building the task RPM.

``TEST``
    The name of the task. The name is a hierarchical path beginning with 
    a slash (``/``), similar to a filesystem path. For example, 
    ``/distribution/mypackage/test-suite``. The task name is available as 
    :envvar:`TEST` in the task's environment.

    The task name is prefixed with ``/mnt/tests`` to form the directory where 
    it will be installed on the system under test. This directory is available 
    as :envvar:`TESTPATH`.

    The task should report results relative to its name (see 
    :ref:`rhts-report-result`).

``TESTVERSION``
    The version of the task. This becomes the version of the task RPM when it 
    is built. As a consequence, it may contain only numbers, digits, and period 
    (``.``).

``FILES``
    A whitespace-separated list of all the files to be included in the task 
    RPM. This must include at least ``testinfo.desc`` (typically given as 
    ``$(METADATA)``), ``runtest.sh``, and ``Makefile``. If a task uses any 
    additional scripts or data, those files must be listed here.

``BUILT_FILES``
    Files which are generated or compiled by other rules in the Makefile should 
    be listed in this variable, rather than in ``FILES``, so that they are 
    built when the task RPM is built.

.. _testinfo.desc:

Fields in ``testinfo.desc``
~~~~~~~~~~~~~~~~~~~~~~~~~~~

The ``testinfo.desc`` file declares metadata about the task. The metadata is 
extracted by Beaker and made available in the task library. The harness also 
uses this metadata, for example to determine the allowed watchdog time for the 
task.

This file is typically generated by the Makefile as part of the build process, 
although it can also be edited and committed directly to source control.

The following fields are recognised by Beaker.

Owner
-----

``Owner`` (optional) is the person responsible for this task. Acceptable
values are a subset of the set of valid email addresses, requiring the
form: "Owner: human readable name <username@domain>".

Name
----

``Name`` (required) It is assumed that any result-reporting framework
will organize all available tests into a hierarchical namespace, using
forward-slashes to separate components of names (analogous to a path).
This field specifies the namespace where the task results will be recorded
in Beaker, and serves as a unique ID for the task. Since task names are
used to define filesystem paths (for example, tasks will be installed
under the path ``/mnt/tests/<task-name>``), they are limited to
characters that are usable within a file system path.

For fast indexing purposes, task names are limited to 255 characters.

Description
-----------

``Description`` (required) must contain exactly one string.

For example:

::

    Description: This test tries to map five 1-gigabyte files with a single process.
    Description: This test tries to exploit the recent security issue for large pix map files.
    Description: This test tries to panic the kernel by creating thousands of processes.

.. _testinfo-testtime:

TestTime
--------

``TestTime`` (required) represents the upper limit of time that the
``runtest.sh`` script should execute before being terminated. That is,
the harness or lab controller should automatically abort the test after
this time period has expired. This is to guard against cases where a test
has entered an infinite loop or caused a system to hang. This field can be
used to achieve better test lab utilization by preventing the test from
running on a system indefinitely.

The value of the field should be a number followed by either the letter
"m" or "h" to express the time in minutes or hours. It can also be
specified in seconds by giving just a number. In most cases, it is
recommended to provide a value in at least minutes rather than seconds.

The time should be the absolute longest a test is expected to take on
the slowest platform supported, plus a 10% margin of error. Setting the
time too short may lead to spurious cancellations, while setting it too long
may waste lab system time if the task does get stuck. Durations of less than
one minute are *not* recommended, as they usually run some risk of spurious
cancellation, and it's typically reasonable to take a minute to abort the
test after an actual infinite loop or deadlock.

For example:

::

    TestTime: 90   # 90 seconds
    TestTime: 1m   # 1 minute
    TestTime: 2h   # 2 hours

Requires
--------

``Requires`` (optional) indicates one or more the packages that are
required to be installed on the test machine for the test to work. The
package being tested (if any) is automatically included via the
``RunFor`` field. Aside from the package under test and the
test harness itself, anything ``runtest.sh`` needs for execution
must be included here.

This field can occur multiple times within the metadata. Each value
should be a space-separated list of package names, or of kickstart
package group names preceded with an @ sign. Each package or group must
occur within the distribution tree under test (specifically, it must
appear in the ``comps.xml`` file).

For example::

    Requires: gdb
    Requires: @legacy-software-development
    Requires: @kde-software-development
    Requires: -pdksh

The last example above shows that we don't want a particular package
installed for this test. Normally you shouldn't have to do this unless
the package is installed by default.

In a lab implementation, the dependencies of the packages listed can be
automatically loaded using yum.

Note that unlike an RPM spec file, only dependencies on actual package names
are permitted (depending on a "virtual" provides is not supported — however,
see :ref:`rhts-requires` for a limited exception). Furthermore, even if some
dependencies cannot be resolved, Beaker will attempt to execute the task
anyway (this simplifies some issues with cross-version tasks as described
below).

If a task dependency ever changes in a backwards incompatible way,
one of the approaches below may be helpful:

*  if only a dependency has changed name, specify both the names
   of dependencies in the ``Requires:`` field (enabling this is the reason
   that missing packages are silently ignored).

*  it may be possible to work around the differences by logic in the
   section of the ``Makefile`` that generates the ``testinfo.desc``
   file.

*  for major changes, split the test, so that each incompatible version is
   handled by a separate task in a sub-directory, with the common files built
   from a shared directory in the ``Makefile``.

When writing a multihost test involving multiple roles client(s) and
server(s), the union of the requirements for all of the roles must be
listed here.


Provides
--------

``Provides`` (optional) allows the task creator to specify the capabilities
that the task RPM provides upon install. In addition to the default
``Provides`` generated by RPM, every task provides a virtual
capability derived from the task name. For example, the
``/distribution/install`` task also provides ``test(/distribution/install)``.

You can specify additional capabilities by adding new ``Provides``
lines (using a similar syntax to ``Requires``). For example, if your
task provides equivalent or better functionality than an old task, you
can add a ``Provides`` such as the one below::

    Provides: test(/old/task/name)


.. _rhts-requires:

RhtsRequires
------------

This field indicates the other beaker tests that are required to be
installed on the test machine for the test to work.

This field can occur multiple times within the metadata. Each value
should consist of a task name in the form ``test(<task-name>)``. Each
task dependency named this way must exist in the Beaker task library
or the task will be aborted.

For example:: 

    RhtsRequires: test(/distribution/rhts/common)

RhtsOptions
-----------

You can indicate that your task does not need to be run inside the 
``rhts-compat`` service::

    RhtsOptions: -Compatible

This option has no effect on newer distros. See :doc:`rhts-compat`.

RunFor
------

``RunFor`` (optional) allows entries in the Beaker task library to be
associated with specific packages for test execution and reporting purposes.
It is only relevant for tasks that are specifically written as tests for
particular packages rather than as general utilities. 

When testing a specific package, that package should be listed in this
field. If the test might reasonably be affected by changes to another
package, the other package should also be listed here. If a package changes
names but the task remains applicable, then all of the package's names
should be listed here.

This field is optional and can occur multiple times within the
metadata. The value should be a space-separated list of package names.

.. _testinfo-releases:

Releases
--------

Some tests are only applicable to certain distribution releases. For
example, a kernel bug may only be applicable to RHEL3 which contains the
2.4 kernel. Limiting the release should only be used when a task will
not execute on a particular release. Otherwise, the release should not
be restricted so that your test can run on as many different releases as
possible.

You can populate the optional ``Releases`` field in two different ways. To
exclude  certain releases but include all others, list the releases each
prefixed with  a minus sign (-). To include certain releases but exclude
all others, list the  included releases.

For example, if your task runs only on RHEL3 and RHEL4::

    Releases: RedHatEnterpriseLinux3 RedHatEnterpriseLinux4

Or, if your task is expected to run on any release except for RHEL3::

    Releases: -RedHatEnterpriseLinux3

Releases are identified by their OS major version. You can browse a list of OS 
versions in Beaker by selecting :menuselection:`Distros --> Family` from the 
menu. For example:

-  RedHatEnterpriseLinux3
-  RedHatEnterpriseLinux4
-  RedHatEnterpriseLinuxServer5
-  RedHatEnterpriseLinuxClient5
-  RedHatEnterpriseLinux6
-  RedHatEnterpriseLinux7
-  Fedora17

Your Beaker administrator may have configured compatibility aliases for some OS 
versions, which you can also use in the ``Releases`` field. See 
:ref:`admin-os-versions` in the Administration Guide.
